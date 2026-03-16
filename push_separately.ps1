$ErrorActionPreference = "Continue"

function Push-File($status, $file) {
    $basename = Split-Path $file -Leaf
    if ($status -eq "D") {
        Write-Host "Removing and pushing: $file"
        git rm "$file"
        git commit -m "chore: delete $basename separately"
    } else {
        Write-Host "Adding and pushing: $file"
        git add "$file"
        git commit -m "chore: push $basename separately"
    }
    
    $pushResult = git push origin main 2>&1
    Write-Host $pushResult
}

$changes = git status --porcelain
foreach ($line in $changes) {
    if ($line -match '^ M (.*)') {
        Push-File "M" $Matches[1].Trim()
    } elseif ($line -match '^ D (.*)') {
        Push-File "D" $Matches[1].Trim()
    } elseif ($line -match '^\?\? (.*)') {
        Push-File "M" $Matches[1].Trim()
    } elseif ($line -match '^A  (.*)') {
        Push-File "M" $Matches[1].Trim()
    } elseif ($line -match '^R  (.*) -> (.*)') {
        # Renamed: treat as add of new path
        Push-File "M" $Matches[2].Trim()
    }
}

Write-Host "Finished pushing all files separately."
