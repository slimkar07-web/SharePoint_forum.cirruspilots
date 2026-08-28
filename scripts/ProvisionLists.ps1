# Connect to your site first using:
Connect-PnPOnline -Url "https://jjcsystems.sharepoint.com/sites/ShieldFormDemo" -UseWebLogin

$categoriesListName = "ForumCategories"
$topicsListName = "ForumTopics"
$repliesListName = "ForumReplies"

Write-Host "Starting to provision lists..."

# 1. Create ForumCategories List (Already created, just fetching it)
$catList = Get-PnPList -Identity $categoriesListName -ErrorAction SilentlyContinue
if (-not $catList) {
    Write-Host "Creating list: $categoriesListName"
    $catList = New-PnPList -Title $categoriesListName -Template GenericList -Url "Lists/$categoriesListName"
    Add-PnPField -List $categoriesListName -DisplayName "Description" -InternalName "Description" -Type Note -AddToDefaultView | Out-Null
    Add-PnPField -List $categoriesListName -DisplayName "ColorHex" -InternalName "ColorHex" -Type Text -AddToDefaultView | Out-Null
    Add-PnPField -List $categoriesListName -DisplayName "IconName" -InternalName "IconName" -Type Text -AddToDefaultView | Out-Null
}

# Delete Topics and Replies lists to recreate them properly
if (Get-PnPList -Identity $topicsListName -ErrorAction SilentlyContinue) { Remove-PnPList -Identity $topicsListName -Force -Recycle }
if (Get-PnPList -Identity $repliesListName -ErrorAction SilentlyContinue) { Remove-PnPList -Identity $repliesListName -Force -Recycle }

# 2. Create ForumTopics List
Write-Host "Creating list: $topicsListName"
$topicsList = New-PnPList -Title $topicsListName -Template GenericList -Url "Lists/$topicsListName"

Add-PnPField -List $topicsListName -DisplayName "URL" -InternalName "URL" -Type URL -AddToDefaultView | Out-Null
Add-PnPField -List $topicsListName -DisplayName "Excerpt" -InternalName "Excerpt" -Type Note -AddToDefaultView | Out-Null

# Lookup field to Categories via XML
$catId = $catList.Id.Guid
$lookupXml = "<Field Type='Lookup' DisplayName='Category' Required='FALSE' EnforceUniqueValues='FALSE' List='{$catId}' ShowField='Title' Name='Category' StaticName='Category' />"
Add-PnPFieldFromXml -List $topicsListName -FieldXml $lookupXml | Out-Null

Add-PnPField -List $topicsListName -DisplayName "RepliesCount" -InternalName "RepliesCount" -Type Number -AddToDefaultView | Out-Null
Add-PnPField -List $topicsListName -DisplayName "ViewsCount" -InternalName "ViewsCount" -Type Number -AddToDefaultView | Out-Null
Add-PnPField -List $topicsListName -DisplayName "LastActivity" -InternalName "LastActivity" -Type DateTime -AddToDefaultView | Out-Null
Add-PnPField -List $topicsListName -DisplayName "IsLocked" -InternalName "IsLocked" -Type Boolean -AddToDefaultView | Out-Null
Add-PnPField -List $topicsListName -DisplayName "IsPinned" -InternalName "IsPinned" -Type Boolean -AddToDefaultView | Out-Null

Add-PnPField -List $topicsListName -DisplayName "Tags" -InternalName "Tags" -Type MultiChoice -AddToDefaultView -Choices "Volunteers","Questions","Login","Portal","News" | Out-Null

# UserMulti field via XML
$userXml = "<Field Type='UserMulti' DisplayName='Posters' Required='FALSE' EnforceUniqueValues='FALSE' UserSelectionMode='PeopleAndGroups' UserSelectionScope='0' Mult='TRUE' Name='Posters' StaticName='Posters' />"
Add-PnPFieldFromXml -List $topicsListName -FieldXml $userXml | Out-Null


# 3. Create ForumReplies List
Write-Host "Creating list: $repliesListName"
$repliesList = New-PnPList -Title $repliesListName -Template GenericList -Url "Lists/$repliesListName"

# Lookup field to Topics via XML
$topListObj = Get-PnPList -Identity $topicsListName
$topId = $topListObj.Id.Guid
$topLookupXml = "<Field Type='Lookup' DisplayName='Topic' Required='FALSE' EnforceUniqueValues='FALSE' List='{$topId}' ShowField='Title' Name='Topic' StaticName='Topic' />"
Add-PnPFieldFromXml -List $repliesListName -FieldXml $topLookupXml | Out-Null

Add-PnPField -List $repliesListName -DisplayName "Body" -InternalName "Body" -Type Note -AddToDefaultView | Out-Null
Add-PnPField -List $repliesListName -DisplayName "IsAcceptedAnswer" -InternalName "IsAcceptedAnswer" -Type Boolean -AddToDefaultView | Out-Null

Write-Host "List provisioning complete!"
