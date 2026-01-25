# UTF-8 encoding fix script
$replacements = @{
    '�?' = '日'
    '�?' = '周'
    '�?' = '月'
    '�?' = '中'
    '�?' = '止'
    '�?' = '态'
    '�?' = '性'
    '�?' = '引'
    '�?' = '量'
    '�?' = '间'
    '�?' = '�' = '��'
    '块' = '块'
    '速' = '速'
    '索' = '索'
    '本' = '本'
    '停' = '停'
    '暂' = '暂'
    '尾' = '尾'
    '组' = '组'
    '图' = '图'
    '状' = '状'
    '折' = '折'
    '趋' = '趋'
    '势' = '势'
    '℃' = '℃'
    '值' = '值'
    '氧' = '氧'
    '解' = '解'
    '溶' = '溶'
    '优' = '优'
}

Get-ChildItem -Path "src" -Recurse -Filter "*.vue" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $changed = $false
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
            $changed = $true
        }
    }
    
    if ($changed) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($_.FullName, $content, $utf8NoBom)
        Write-Host "Fixed: $($_.Name)"
    }
}

Write-Host "Encoding fix complete!"

