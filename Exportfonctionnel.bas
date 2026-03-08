Option Explicit

' =========================================================================================
' CONFIGURATION SUPABASE - À MODIFIER AVEC VOS INFOS
' =========================================================================================
Const SUPABASE_URL As String = "https://xciusxowoxlostxxpbjn.supabase.co"
' Remplacer avec votre SERVICE_ROLE_KEY (Settings > API > Project API keys)
Const SUPABASE_KEY As String = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaXVzeG93b3hsb3N0eHhwYmpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxNTg3OCwiZXhwIjoyMDg0NDkxODc4fQ.b3Y5PKHKMD_fkHhE3KkMmZBuFDyVWoseLVIFn5RB6VQ"

' Variables globales pour la barre de progression
Public progressUserForm As Object
Public progressLabel As Object
Public progressBar As Object
Public cancelSync As Boolean

' =========================================================================================
' MACRO PRINCIPALE - À ASSOCIER À UN BOUTON
' =========================================================================================
Sub SynchroniserOngletActif()
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Set ws = ActiveSheet
    
    ' Vérifier que nous sommes sur la bonne feuille
    If ws.Name = "" Then
        MsgBox "Aucune feuille active!", vbExclamation
        Exit Sub
    End If
    
    ' Demander confirmation
    Dim response As VbMsgBoxResult
    response = MsgBox("Voulez-vous synchroniser les données de '" & ws.Name & "' vers Supabase?" & vbCrLf & _
                      "Cela peut prendre quelques instants.", vbYesNo + vbQuestion, "Confirmation")
    
    If response <> vbYes Then Exit Sub
    
    ' Analyser le nom de l'onglet
    Dim cleanName As String
    cleanName = LCase(ws.Name)
    cleanName = Replace(cleanName, "é", "e")
    cleanName = Replace(cleanName, "è", "e")
    cleanName = Replace(cleanName, "ê", "e")
    
    ' Désactiver les mises à jour pour optimiser les performances
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False
    
    ' Initialiser l'annulation
    cancelSync = False
    
    ' Afficher la barre de progression
    Call ShowProgress("Préparation de la synchronisation...")
    
    ' Détecter le type de données et synchroniser
    Dim success As Boolean
    success = False
    
    If InStr(cleanName, "planning") > 0 Then
        success = SynchroniserPlanning(ws)
    ElseIf InStr(cleanName, "notes") > 0 Or InStr(cleanName, "eleves") > 0 Then
        Dim trimestre As Integer
        If InStr(cleanName, "t1") > 0 Then
            trimestre = 1
        ElseIf InStr(cleanName, "t2") > 0 Then
            trimestre = 2
        ElseIf InStr(cleanName, "t3") > 0 Then
            trimestre = 3
        Else
            trimestre = 0
        End If
        
        If trimestre > 0 Then
            success = SynchroniserNotes(ws, trimestre)
        Else
            MsgBox "Trimestre non détecté dans le nom de l'onglet.", vbExclamation
        End If
    Else
        MsgBox "Type de données non reconnu. Nom de l'onglet doit contenir 'planning' ou 'notes'.", vbExclamation
    End If
    
    ' Nettoyer
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
    
    ' Fermer la barre de progression
    Call HideProgress
    
    ' Afficher le résultat
    If success Then
        MsgBox "Synchronisation terminée avec succès!", vbInformation, "Succès"
    ElseIf Not cancelSync Then
        MsgBox "La synchronisation a rencontré des erreurs. Voir la fenêtre Debug (Ctrl+G).", vbExclamation, "Attention"
    End If
    
    Exit Sub
    
ErrorHandler:
    ' Réactiver les fonctionnalités Excel en cas d'erreur
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
    Call HideProgress
    
    MsgBox "Erreur lors de la synchronisation:" & vbCrLf & _
           "Description: " & Err.Description & vbCrLf & _
           "Numéro: " & Err.Number, vbCritical, "Erreur"
End Sub

' =========================================================================================
' SYNCHRONISATION DU PLANNING
' =========================================================================================
Function SynchroniserPlanning(ws As Worksheet) As Boolean
    On Error GoTo ErrorHandler
    
    Dim lastRow As Long, i As Long
    Dim httpRequest As Object
    Dim jsonBody As String
    Dim responseText As String
    Dim successCount As Long, errorCount As Long
    
    ' Initialiser
    Set httpRequest = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' Vérifier qu'il y a des données
    If lastRow < 3 Then
        MsgBox "Aucune donnée dans le planning (moins de 3 lignes).", vbExclamation
        SynchroniserPlanning = False
        Exit Function
    End If
    
    ' Ajouter une colonne pour le statut si elle n'existe pas
    If ws.Cells(1, 27).Value = "" Then
        ws.Cells(1, 27).Value = "Statut Sync"
        ws.Cells(1, 27).Font.Bold = True
        ws.Cells(1, 27).Interior.Color = RGB(200, 200, 200)
    End If
    
    successCount = 0
    errorCount = 0
    
    ' Parcourir les lignes de données (à partir de la ligne 3)
    For i = 3 To lastRow
        ' Vérifier l'annulation
        If cancelSync Then Exit For
        
        ' Mettre à jour la progression
        Call UpdateProgress(i - 2, lastRow - 2, _
                            "Planning - Ligne " & i & "/" & lastRow & _
                            " (Succès: " & successCount & ", Erreurs: " & errorCount & ")")
        
        ' Ignorer les lignes vides
        If trim(ws.Cells(i, 1).Value & "") = "" And trim(ws.Cells(i, 2).Value & "") = "" Then
            ws.Cells(i, 27).Value = "Ignoré (vide)"
            ws.Cells(i, 27).Interior.Color = RGB(255, 255, 200)
            GoTo ContinueLoop
        End If
        
        ' Construire le JSON
        jsonBody = "{"
        jsonBody = jsonBody & """nom"":""" & EscapeJson(ws.Cells(i, 1).Value) & ""","
        jsonBody = jsonBody & """prenom"":""" & EscapeJson(ws.Cells(i, 2).Value) & ""","
        jsonBody = jsonBody & """indicateurs"":{"
        jsonBody = jsonBody & """cond"":""" & EscapeJson(ws.Cells(i, 3).Value) & ""","
        jsonBody = jsonBody & """rec"":""" & EscapeJson(ws.Cells(i, 4).Value) & ""","
        jsonBody = jsonBody & """deriv"":""" & EscapeJson(ws.Cells(i, 5).Value) & ""","
        jsonBody = jsonBody & """signe"":""" & EscapeJson(ws.Cells(i, 6).Value) & ""","
        jsonBody = jsonBody & """sg"":""" & EscapeJson(ws.Cells(i, 7).Value) & ""","
        jsonBody = jsonBody & """cv"":""" & EscapeJson(ws.Cells(i, 8).Value) & ""","
        jsonBody = jsonBody & """python"":""" & EscapeJson(ws.Cells(i, 9).Value) & ""","
        jsonBody = jsonBody & """lim"":""" & EscapeJson(ws.Cells(i, 10).Value) & ""","
        jsonBody = jsonBody & """graph"":""" & EscapeJson(ws.Cells(i, 11).Value) & ""","
        jsonBody = jsonBody & """conv"":""" & EscapeJson(ws.Cells(i, 12).Value) & ""","
        jsonBody = jsonBody & """vect"":""" & EscapeJson(ws.Cells(i, 13).Value) & ""","
        jsonBody = jsonBody & """dte"":""" & EscapeJson(ws.Cells(i, 14).Value) & ""","
        jsonBody = jsonBody & """lim_fn"":""" & EscapeJson(ws.Cells(i, 15).Value) & ""","
        jsonBody = jsonBody & """co"":""" & EscapeJson(ws.Cells(i, 16).Value) & ""","
        jsonBody = jsonBody & """den"":""" & EscapeJson(ws.Cells(i, 17).Value) & ""","
        jsonBody = jsonBody & """trigo"":""" & EscapeJson(ws.Cells(i, 18).Value) & ""","
        jsonBody = jsonBody & """plan"":""" & EscapeJson(ws.Cells(i, 19).Value) & ""","
        jsonBody = jsonBody & """v"":""" & EscapeJson(ws.Cells(i, 20).Value) & ""","
        jsonBody = jsonBody & """bino"":""" & EscapeJson(ws.Cells(i, 21).Value) & ""","
        jsonBody = jsonBody & """integr"":""" & EscapeJson(ws.Cells(i, 22).Value) & ""","
        jsonBody = jsonBody & """aire"":""" & EscapeJson(ws.Cells(i, 23).Value) & ""","
        jsonBody = jsonBody & """int_plus"":""" & EscapeJson(ws.Cells(i, 24).Value) & ""","
        jsonBody = jsonBody & """va"":""" & EscapeJson(ws.Cells(i, 25).Value) & ""","
        jsonBody = jsonBody & """ed"":""" & EscapeJson(ws.Cells(i, 26).Value) & """"
        jsonBody = jsonBody & "}}"
        
        ' Envoyer la requête
        If SendToSupabase(httpRequest, "sync_planning_excel", jsonBody, responseText) Then
            ' Succès
            ws.Cells(i, 27).Value = "? " & Format(Now, "hh:mm:ss")
            ws.Cells(i, 27).Interior.Color = RGB(200, 255, 200)
            successCount = successCount + 1
        Else
            ' Erreur
            ws.Cells(i, 27).Value = "? Erreur"
            ws.Cells(i, 27).Interior.Color = RGB(255, 200, 200)
            ws.Cells(i, 28).Value = Left(responseText, 100)
            errorCount = errorCount + 1
        End If
        
ContinueLoop:
        DoEvents ' Permettre les mises à jour de l'interface
    Next i
    
    ' Résumé
    If errorCount = 0 Then
        Call UpdateProgress(lastRow - 2, lastRow - 2, _
                            "Terminé! " & successCount & " lignes synchronisées avec succès.")
    Else
        Call UpdateProgress(lastRow - 2, lastRow - 2, _
                            "Terminé avec " & errorCount & " erreurs sur " & (successCount + errorCount) & " lignes.")
    End If
    
    SynchroniserPlanning = (errorCount = 0)
    Exit Function
    
ErrorHandler:
    SynchroniserPlanning = False
    Debug.Print "Erreur SynchroniserPlanning: " & Err.Description
End Function

' =========================================================================================
' SYNCHRONISATION DES NOTES
' =========================================================================================
Function SynchroniserNotes(ws As Worksheet, trimestre As Integer) As Boolean
    On Error GoTo ErrorHandler
    
    Dim lastRow As Long, i As Long
    Dim httpRequest As Object
    Dim jsonBody As String
    Dim responseText As String
    Dim successCount As Long, errorCount As Long
    
    ' Initialiser
    Set httpRequest = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' Vérifier qu'il y a des données
    If lastRow < 3 Then
        MsgBox "Aucune donnée dans les notes (moins de 3 lignes).", vbExclamation
        SynchroniserNotes = False
        Exit Function
    End If
    
    ' Ajouter une colonne pour le statut si elle n'existe pas
    If ws.Cells(1, 13).Value = "" Then
        ws.Cells(1, 13).Value = "Statut Sync T" & trimestre
        ws.Cells(1, 13).Font.Bold = True
        ws.Cells(1, 13).Interior.Color = RGB(200, 200, 200)
    End If
    
    successCount = 0
    errorCount = 0
    
    ' Parcourir les lignes de données
    For i = 3 To lastRow
        ' Vérifier l'annulation
        If cancelSync Then Exit For
        
        ' Mettre à jour la progression
        Call UpdateProgress(i - 2, lastRow - 2, _
                            "Notes T" & trimestre & " - Ligne " & i & "/" & lastRow & _
                            " (Succès: " & successCount & ", Erreurs: " & errorCount & ")")
        
        ' Ignorer les lignes vides
        If trim(ws.Cells(i, 1).Value & "") = "" And trim(ws.Cells(i, 2).Value & "") = "" Then
            ws.Cells(i, 13).Value = "Ignoré (vide)"
            ws.Cells(i, 13).Interior.Color = RGB(255, 255, 200)
            GoTo ContinueLoop
        End If
        
        ' Construire le JSON
        jsonBody = "{"
        jsonBody = jsonBody & """p_nom"":""" & EscapeJson(ws.Cells(i, 1).Value) & ""","
        jsonBody = jsonBody & """p_prenom"":""" & EscapeJson(ws.Cells(i, 2).Value) & ""","
        jsonBody = jsonBody & """p_trimestre"":" & trimestre & ","
        jsonBody = jsonBody & """p_donnees"":{"
        jsonBody = jsonBody & """moyenne"":" & ToNum(ws.Cells(i, 3).Value) & ","
        jsonBody = jsonBody & """qcm"":" & ToNum(ws.Cells(i, 4).Value) & ","
        jsonBody = jsonBody & """regularite"":" & ToNum(ws.Cells(i, 5).Value) & ","
        jsonBody = jsonBody & """brique_ib"":" & ToNum(ws.Cells(i, 6).Value) & ","
        jsonBody = jsonBody & """brique_plus"":" & ToNum(ws.Cells(i, 7).Value) & ","
        jsonBody = jsonBody & """total_briques"":" & ToNum(ws.Cells(i, 8).Value) & ","
        jsonBody = jsonBody & """apprentissage"":" & ToNum(ws.Cells(i, 9).Value) & ","
        jsonBody = jsonBody & """dst"":" & ToNum(ws.Cells(i, 10).Value) & ","
        jsonBody = jsonBody & """bb"":" & ToNum(ws.Cells(i, 11).Value) & ","
        jsonBody = jsonBody & """classe"":""" & EscapeJson(ws.Cells(i, 12).Value) & """"
        jsonBody = jsonBody & "}}"
        
        ' Envoyer la requête
        If SendToSupabase(httpRequest, "sync_notes_excel", jsonBody, responseText) Then
            ' Succès
            ws.Cells(i, 13).Value = "? T" & trimestre & " " & Format(Now, "hh:mm")
            ws.Cells(i, 13).Interior.Color = RGB(200, 255, 200)
            successCount = successCount + 1
        Else
            ' Erreur
            ws.Cells(i, 13).Value = "? Erreur T" & trimestre
            ws.Cells(i, 13).Interior.Color = RGB(255, 200, 200)
            ws.Cells(i, 14).Value = Left(responseText, 100)
            errorCount = errorCount + 1
        End If
        
ContinueLoop:
        DoEvents
    Next i
    
    ' Résumé
    If errorCount = 0 Then
        Call UpdateProgress(lastRow - 2, lastRow - 2, _
                            "Terminé! " & successCount & " élèves synchronisés pour le trimestre " & trimestre & ".")
    Else
        Call UpdateProgress(lastRow - 2, lastRow - 2, _
                            "Terminé avec " & errorCount & " erreurs sur " & (successCount + errorCount) & " élèves.")
    End If
    
    SynchroniserNotes = (errorCount = 0)
    Exit Function
    
ErrorHandler:
    SynchroniserNotes = False
    Debug.Print "Erreur SynchroniserNotes: " & Err.Description
End Function

' =========================================================================================
' FONCTION D'ENVOI À SUPABASE
' =========================================================================================
Function SendToSupabase(httpRequest As Object, functionName As String, jsonBody As String, ByRef responseText As String) As Boolean
    On Error GoTo ErrorHandler
    
    Dim url As String
    url = SUPABASE_URL & "/rest/v1/rpc/" & functionName
    
    ' Debug: Afficher la requête
    Debug.Print "=== ENVOI À SUPABASE ==="
    Debug.Print "URL: " & url
    Debug.Print "JSON: " & jsonBody
    
    With httpRequest
        .Open "POST", url, False
        .setRequestHeader "Content-Type", "application/json"
        .setRequestHeader "apikey", SUPABASE_KEY
        .setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY
        .setRequestHeader "Prefer", "return=minimal"
        
        .send jsonBody
        
        responseText = .responseText
        Debug.Print "Status: " & .status & " " & .statusText
        Debug.Print "Response: " & responseText
        
        ' Vérifier le statut HTTP
        If .status >= 200 And .status < 300 Then
            SendToSupabase = True
        Else
            SendToSupabase = False
            Debug.Print "ERREUR DÉTAILLÉE: Status=" & .status & ", Response=" & responseText
        End If
    End With
    
    Exit Function
    
ErrorHandler:
    SendToSupabase = False
    responseText = "Erreur: " & Err.Description & " (No: " & Err.Number & ")"
    Debug.Print "Erreur SendToSupabase: " & responseText
End Function

' =========================================================================================
' FONCTIONS UTILITAIRES
' =========================================================================================
Function ToNum(val As Variant) As String
    ' Convertir une valeur en nombre formaté pour JSON
    If IsNumeric(val) Then
        If Len(trim(CStr(val))) > 0 Then
            ' Remplacer la virgule par un point pour JSON
            ToNum = Replace(Format(val, "0.00"), ",", ".")
        Else
            ToNum = "null"
        End If
    ElseIf IsDate(val) Then
        ' Pour les dates, convertir en timestamp ou chaîne
        ToNum = """" & Format(val, "yyyy-mm-dd") & """"
    ElseIf IsEmpty(val) Or IsNull(val) Then
        ToNum = "null"
    Else
        ' Essayer de convertir en nombre
        On Error Resume Next
        Dim num As Double
        num = CDbl(val)
        If Err.Number = 0 Then
            ToNum = Replace(CStr(num), ",", ".")
        Else
            ToNum = "null"
        End If
        On Error GoTo 0
    End If
End Function

Function EscapeJson(ByVal txt As Variant) As String
    ' Échapper les caractères spéciaux pour JSON
    If IsError(txt) Or IsNull(txt) Or IsEmpty(txt) Then
        EscapeJson = ""
        Exit Function
    End If
    
    Dim tmp As String
    tmp = CStr(txt)
    
    ' Échappement des caractères spéciaux JSON
    tmp = Replace(tmp, "\", "\\")
    tmp = Replace(tmp, """", "\""")
    tmp = Replace(tmp, vbCrLf, "\n")
    tmp = Replace(tmp, vbCr, "\n")
    tmp = Replace(tmp, vbLf, "\n")
    tmp = Replace(tmp, vbTab, "\t")
    tmp = Replace(tmp, vbBack, "\b")
    tmp = Replace(tmp, Chr(12), "\f")
    
    EscapeJson = trim(tmp)
End Function

' =========================================================================================
' GESTION DE LA BARRE DE PROGRESSION
' =========================================================================================
Sub ShowProgress(Optional message As String = "Synchronisation en cours...")
    On Error Resume Next
    
    ' Créer un UserForm simple pour la progression
    Set progressUserForm = ThisWorkbook.VBProject.VBComponents.Add(3) ' 3 = vbext_ct_MSForm
    
    With progressUserForm
        .Properties("Width") = 400
        .Properties("Height") = 120
        .Properties("Caption") = "Synchronisation Supabase"
        .Properties("StartUpPosition") = 1 ' CenterOwner
    End With
    
    ' Ajouter un label pour le message
    Set progressLabel = progressUserForm.designer.Controls.Add("Forms.Label.1")
    With progressLabel
        .Top = 10
        .Left = 10
        .Width = 380
        .Height = 20
        .Caption = message
    End With
    
    ' Ajouter une barre de progression
    Set progressBar = progressUserForm.designer.Controls.Add("Forms.Label.1")
    With progressBar
        .Top = 40
        .Left = 10
        .Width = 0
        .Height = 20
        .BackColor = RGB(0, 120, 215)
    End With
    
    ' Ajouter un bouton Annuler
    Dim cancelBtn As Object
    Set cancelBtn = progressUserForm.designer.Controls.Add("Forms.CommandButton.1")
    With cancelBtn
        .Top = 70
        .Left = 150
        .Width = 100
        .Height = 25
        .Caption = "Annuler"
        .Name = "btnCancel"
    End With
    
    ' Afficher le formulaire (mode non modal pour permettre l'exécution)
    progressUserForm.Activate
End Sub

Sub UpdateProgress(current As Long, total As Long, Optional message As String = "")
    On Error Resume Next
    
    If Not progressLabel Is Nothing Then
        If message <> "" Then
            progressLabel.Caption = message
        Else
            Dim percent As Double
            percent = current / total
            progressLabel.Caption = "Progression: " & current & " / " & total & _
                                   " (" & Format(percent, "0%") & ")"
        End If
    End If
    
    If Not progressBar Is Nothing And total > 0 Then
        Dim widthPercent As Long
        widthPercent = (current / total) * 380
        progressBar.Width = widthPercent
    End If
    
    DoEvents ' Permettre les mises à jour de l'interface
End Sub

Sub HideProgress()
    On Error Resume Next
    
    If Not progressUserForm Is Nothing Then
        ' Nettoyer le UserForm
        ThisWorkbook.VBProject.VBComponents.Remove progressUserForm
        Set progressUserForm = Nothing
        Set progressLabel = Nothing
        Set progressBar = Nothing
    End If
End Sub

' =========================================================================================
' MACRO DE TEST POUR DÉBOGUER
' =========================================================================================
Sub TestConnection()
    ' Tester la connexion à Supabase avec une requête simple
    Dim httpRequest As Object
    Dim responseText As String
    Dim testJson As String
    
    On Error GoTo ErrorHandler
    
    Set httpRequest = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    
    ' Tester avec une requête simple (sync_notes_excel)
    testJson = "{""p_nom"":""TEST"",""p_prenom"":""Jean"",""p_trimestre"":1,""p_donnees"":{""moyenne"":15.5}}"
    
    MsgBox "Test d'envoi à Supabase..." & vbCrLf & _
           "URL: " & SUPABASE_URL & vbCrLf & _
           "Fonction: sync_notes_excel", vbInformation
    
    If SendToSupabase(httpRequest, "sync_notes_excel", testJson, responseText) Then
        MsgBox "Test réussi!" & vbCrLf & _
               "Réponse: " & responseText, vbInformation
    Else
        MsgBox "Test échoué!" & vbCrLf & _
               "Erreur: " & responseText, vbCritical
    End If
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Erreur lors du test:" & vbCrLf & _
           Err.Description, vbCritical
End Sub

Sub AnnulerSynchronisation()
    ' Macro pour annuler la synchronisation en cours
    cancelSync = True
    MsgBox "Synchronisation annulée par l'utilisateur.", vbInformation
End Sub

' =========================================================================================
' MACRO POUR VIDER LES COLONNES DE STATUT
' =========================================================================================
Sub ViderStatuts()
    ' Vider les colonnes de statut de synchronisation
    Dim ws As Worksheet
    Set ws = ActiveSheet
    
    On Error Resume Next
    
    ' Colonne 27 pour Planning, 13 pour Notes
    ws.Columns(13).ClearContents
    ws.Columns(27).ClearContents
    
    ' Réinitialiser la mise en forme
    ws.Columns(13).Interior.ColorIndex = xlNone
    ws.Columns(27).Interior.ColorIndex = xlNone
    
    MsgBox "Colonnes de statut vidées.", vbInformation
End Sub

' =========================================================================================
' INSTRUCTIONS D'INSTALLATION
' =========================================================================================
' 1. Copier tout ce code dans un module VBA (Insert > Module)
' 2. Remplacer SUPABASE_KEY avec votre SERVICE_ROLE_KEY
' 3. Créer les fonctions RPC dans Supabase (voir instructions ci-dessous)
' 4. Associer la macro "SynchroniserOngletActif" à un bouton dans Excel
' 5. Tester d'abord avec "TestConnection"

' Instructions pour créer les fonctions RPC dans Supabase:
' 1. Aller dans l'éditeur SQL de Supabase
' 2. Exécuter les requêtes SQL suivantes:

' -- Pour le planning:
' CREATE OR REPLACE FUNCTION sync_planning_excel(
'   p_nom text,
'   p_prenom text,
'   p_indicateurs jsonb
' )
' RETURNS void AS $$
' BEGIN
'   INSERT INTO planning (nom, prenom, indicateurs, updated_at)
'   VALUES (p_nom, p_prenom, p_indicateurs, NOW())
'   ON CONFLICT (nom, prenom)
'   DO UPDATE SET
'     indicateurs = EXCLUDED.indicateurs,
'     updated_at = NOW();
' END;
' $$ LANGUAGE plpgsql SECURITY DEFINER;

' -- Pour les notes:
' CREATE OR REPLACE FUNCTION sync_notes_excel(
'   p_nom text,
'   p_prenom text,
'   p_trimestre integer,
'   p_donnees jsonb
' )
' RETURNS void AS $$
' BEGIN
'   INSERT INTO notes (nom, prenom, trimestre, donnees, updated_at)
'   VALUES (p_nom, p_prenom, p_trimestre, p_donnees, NOW())
'   ON CONFLICT (nom, prenom, trimestre)
'   DO UPDATE SET
'     donnees = EXCLUDED.donnees,
'     updated_at = NOW();
' END;
' $$ LANGUAGE plpgsql SECURITY DEFINER;

' 3. Assurez-vous que les tables existent avec les colonnes appropriées


