#!/usr/bin/env pwsh
$API = "https://event-api.info1703.workers.dev"
$pass = 0
$fail = 0

Write-Host "`n=== EVENT API SYSTEM TEST ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$API/" -TimeoutSec 10 -UseBasicParsing
    if ($r.StatusCode -eq 200) { Write-Host "   PASS" -ForegroundColor Green; $pass++ }
    else { Write-Host "   FAIL: Status $($r.StatusCode)" -ForegroundColor Red; $fail++ }
} catch { Write-Host "   FAIL: $_" -ForegroundColor Red; $fail++ }

# Test 2: Public Events
Write-Host "2. Get Public Events..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$API/api/events" -TimeoutSec 10 -UseBasicParsing
    if ($r.StatusCode -eq 200) { Write-Host "   PASS" -ForegroundColor Green; $pass++ }
    else { Write-Host "   FAIL: Status $($r.StatusCode)" -ForegroundColor Red; $fail++ }
} catch { Write-Host "   FAIL: $_" -ForegroundColor Red; $fail++ }

# Test 3: Non-existent Event
Write-Host "3. Get Non-existent Event (expect 404)..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$API/api/events/999" -TimeoutSec 10 -UseBasicParsing
    Write-Host "   FAIL: Should return 404" -ForegroundColor Red; $fail++
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 404) { 
        Write-Host "   PASS" -ForegroundColor Green; $pass++ 
    } else { 
        Write-Host "   FAIL: Wrong status" -ForegroundColor Red; $fail++ 
    }
}

# Test 4: Create Event without Auth (expect 401)
Write-Host "4. Create Event without Auth (expect 401)..." -ForegroundColor Yellow
try {
    $body = @{ slug="test"; name="Test"; start_date="2026-12-01"; end_date="2026-12-03" } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$API/api/events" -Method POST -Body $body -TimeoutSec 10 -UseBasicParsing
    Write-Host "   FAIL: Should return 401" -ForegroundColor Red; $fail++
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) { 
        Write-Host "   PASS" -ForegroundColor Green; $pass++ 
    } else { 
        Write-Host "   FAIL: Wrong status $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red; $fail++ 
    }
}

# Test 5: Invalid Endpoint (expect 404)
Write-Host "5. Invalid Endpoint (expect 404)..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$API/api/nonexistent" -TimeoutSec 10 -UseBasicParsing
    Write-Host "   FAIL: Should return 404" -ForegroundColor Red; $fail++
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 404) { 
        Write-Host "   PASS" -ForegroundColor Green; $pass++ 
    } else { 
        Write-Host "   FAIL: Wrong status" -ForegroundColor Red; $fail++ 
    }
}

# Test 6: Missing Required Fields (expect 400)
Write-Host "6. Missing Required Fields (expect 400)..." -ForegroundColor Yellow
try {
    $body = @{ email="test@test.com" } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$API/api/events/1/registrations" -Method POST -Body $body -TimeoutSec 10 -UseBasicParsing
    Write-Host "   FAIL: Should return 400" -ForegroundColor Red; $fail++
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 400) { 
        Write-Host "   PASS" -ForegroundColor Green; $pass++ 
    } else { 
        Write-Host "   FAIL: Wrong status" -ForegroundColor Red; $fail++ 
    }
}

# Test 7: File Structure
Write-Host "7. Codebase Files..." -ForegroundColor Yellow
$files = @(
    "src/index.ts",
    "src/endpoints/events/router.ts",
    "src/endpoints/registrations/router.ts",
    "src/endpoints/speakers/router.ts",
    "wrangler.json"
)
$fileOk = $true
foreach ($f in $files) {
    if (-not (Test-Path "f:\hadmaj\event-api\$f")) {
        Write-Host "   MISSING: $f" -ForegroundColor Red
        $fileOk = $false
        $fail++
    }
}
if ($fileOk) { Write-Host "   PASS" -ForegroundColor Green; $pass++ }

# Test 8: Migrations
Write-Host "8. Database Migrations..." -ForegroundColor Yellow
$migs = @(
    "0001_initial.sql",
    "0002_seed.sql",
    "0003_form_config.sql",
    "0004_site_config.sql",
    "0005_extra_fields.sql",
    "0006_clear_registrations.sql"
)
$migOk = $true
foreach ($m in $migs) {
    if (-not (Test-Path "f:\hadmaj\event-api\migrations\$m")) {
        Write-Host "   MISSING: $m" -ForegroundColor Red
        $migOk = $false
        $fail++
    }
}
if ($migOk) { Write-Host "   PASS: All migrations present" -ForegroundColor Green; $pass++ }

# Summary
Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
Write-Host "PASSED: $pass" -ForegroundColor Green
Write-Host "FAILED: $fail" -ForegroundColor Red
Write-Host "================`n" -ForegroundColor Cyan

if ($fail -eq 0) {
    Write-Host "SUCCESS! All tests passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAILURE! Some tests failed." -ForegroundColor Red
    exit 1
}
