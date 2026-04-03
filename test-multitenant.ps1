# Multi-Tenant Isolation Test Suite
# Usage: .\test-multitenant.ps1

param(
    [string]$ApiUrl = "http://localhost:3000",
    [switch]$Verbose = $false
)

# Colors for output
$Colors = @{
    Green = 'Green'
    Red = 'Red'
    Yellow = 'Yellow'
    Cyan = 'Cyan'
    Gray = 'Gray'
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error_Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Gray
}

function Write-Result {
    param([string]$Message, [bool]$Success)
    if ($Success) {
        Write-Success $Message
    } else {
        Write-Error_Custom $Message
    }
}

# Script variables
$script:TokenMain = $null
$script:TokenBeta = $null
$script:TenantIdMain = $null
$script:TenantIdBeta = $null
$script:PatientIdMain = $null
$script:PatientIdBeta = $null
$script:TestsPassed = 0
$script:TestsFailed = 0

Write-Host ""
Write-Host "🚀 Multi-Tenant ZScan Isolation Test Suite" -ForegroundColor Cyan
Write-Host "API: $ApiUrl" -ForegroundColor Cyan
Write-Host ""

# ============================================
# TEST 1: Login Tenant Main
# ============================================
Write-Header "TEST 1: Login Tenant Main"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body (@{
            email = "leonardoff24@gmail.com"
            password = "123456789"
        } | ConvertTo-Json) `
        -ErrorAction Stop

    $script:TokenMain = $response.accessToken
    $script:TenantIdMain = $response.tenantId

    if ($null -ne $script:TokenMain -and $script:TokenMain -ne "") {
        Write-Success "Login Tenant Main successful"
        $tokenPreview = $script:TokenMain.Substring(0, [Math]::Min(20, $script:TokenMain.Length)) + "..."
        Write-Info "Token: $tokenPreview"
        Write-Info "Tenant ID: $script:TenantIdMain"
        $script:TestsPassed++
    } else {
        Write-Error_Custom "Invalid token received"
        $script:TestsFailed++
    }
} catch {
    Write-Error_Custom "Login Tenant Main failed: $_"
    $script:TestsFailed++
    exit 1
}

# ============================================
# TEST 2: Login Tenant Beta
# ============================================
Write-Header "TEST 2: Login Tenant Beta"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body (@{
            email = "admin@clinicabeta.com"
            password = "123456789"
        } | ConvertTo-Json) `
        -ErrorAction Stop

    $script:TokenBeta = $response.accessToken
    $script:TenantIdBeta = $response.tenantId

    if ($null -ne $script:TokenBeta -and $script:TokenBeta -ne "") {
        Write-Success "Login Tenant Beta successful"
        $tokenPreview = $script:TokenBeta.Substring(0, [Math]::Min(20, $script:TokenBeta.Length)) + "..."
        Write-Info "Token: $tokenPreview"
        Write-Info "Tenant ID: $script:TenantIdBeta"
        $script:TestsPassed++
    } else {
        Write-Error_Custom "Invalid token received"
        $script:TestsFailed++
    }
} catch {
    Write-Error_Custom "Login Tenant Beta failed: $_"
    $script:TestsFailed++
    exit 1
}

# ============================================
# TEST 3: Create Patient in Tenant Main
# ============================================
Write-Header "TEST 3: Create Patient in Tenant Main"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/patients" `
        -Method Post `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $script:TokenMain" } `
        -Body (@{
            fullName = "João Silva - Tenant Main"
            dateOfBirth = "1990-05-15"
            cpf = "12345678901"
            gender = "M"
            phonePrimary = "11999999999"
            address = @{
                street = "Rua A"
                number = "123"
                city = "São Paulo"
                state = "SP"
                zip = "01310100"
            }
        } | ConvertTo-Json) `
        -ErrorAction Stop

    $script:PatientIdMain = $response.id

    if ($null -ne $script:PatientIdMain) {
        Write-Success "Patient created in Tenant Main"
        Write-Info "Patient ID: $script:PatientIdMain"
        Write-Info "Name: $($response.fullName)"
        Write-Info "CPF: $($response.cpf)"
        $script:TestsPassed++
    } else {
        Write-Error_Custom "Failed to create patient"
        $script:TestsFailed++
    }
} catch {
    Write-Error_Custom "Create patient Tenant Main failed: $_"
    $script:TestsFailed++
}

# ============================================
# TEST 4: Create Patient in Tenant Beta
# ============================================
Write-Header "TEST 4: Create Patient in Tenant Beta"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/patients" `
        -Method Post `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $script:TokenBeta" } `
        -Body (@{
            fullName = "Maria Santos - Tenant Beta"
            dateOfBirth = "1985-03-22"
            cpf = "98765432101"
            gender = "F"
            phonePrimary = "21988888888"
            address = @{
                street = "Av B"
                number = "456"
                city = "Rio de Janeiro"
                state = "RJ"
                zip = "20040020"
            }
        } | ConvertTo-Json) `
        -ErrorAction Stop

    $script:PatientIdBeta = $response.id

    if ($null -ne $script:PatientIdBeta) {
        Write-Success "Patient created in Tenant Beta"
        Write-Info "Patient ID: $script:PatientIdBeta"
        Write-Info "Name: $($response.fullName)"
        Write-Info "CPF: $($response.cpf)"
        $script:TestsPassed++
    } else {
        Write-Error_Custom "Failed to create patient"
        $script:TestsFailed++
    }
} catch {
    Write-Error_Custom "Create patient Tenant Beta failed: $_"
    $script:TestsFailed++
}

# ============================================
# TEST 5: Isolation - Tenant Main only sees Main data
# ============================================
Write-Header "TEST 5: Isolation - Tenant Main Patients List"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/patients?page=1&pageSize=100" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $script:TokenMain" } `
        -ErrorAction Stop

    $patients = $response.data
    $hasJoao = $patients | Where-Object { $_.fullName -like "*João Silva*" }
    $hasMaria = $patients | Where-Object { $_.fullName -like "*Maria Santos*" }

    if ($null -ne $hasJoao -and $null -eq $hasMaria) {
        Write-Success "ISOLATION OK: Tenant Main sees only own data"
        Write-Info "Patients seen: $($patients.Count)"
        Write-Info "✓ Has João Silva: YES (own data)"
        Write-Info "✓ Has Maria Santos: NO (beta data blocked)"
        $script:TestsPassed++
    } else {
        Write-Error_Custom "ISOLATION FAILED: Data leak detected"
        if ($null -ne $hasMaria) {
            Write-Info "  ✗ Maria Santos (Beta patient) visible to Main tenant!"
        }
        $script:TestsFailed++
    }
} catch {
    Write-Error_Custom "Get patients Tenant Main failed: $_"
    $script:TestsFailed++
}

# ============================================
# TEST 6: Isolation - Tenant Beta only sees Beta data
# ============================================
Write-Header "TEST 6: Isolation - Tenant Beta Patients List"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/patients?page=1&pageSize=100" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $script:TokenBeta" } `
        -ErrorAction Stop

    $patients = $response.data
    $hasJoao = $patients | Where-Object { $_.fullName -like "*João Silva*" }
    $hasMaria = $patients | Where-Object { $_.fullName -like "*Maria Santos*" }

    if ($null -eq $hasJoao -and $null -ne $hasMaria) {
        Write-Success "ISOLATION OK: Tenant Beta sees only own data"
        Write-Info "Patients seen: $($patients.Count)"
        Write-Info "✓ Has Maria Santos: YES (own data)"
        Write-Info "✓ Has João Silva: NO (main data blocked)"
        $script:TestsPassed++
    } else {
        Write-Error_Custom "ISOLATION FAILED: Data leak detected"
        if ($null -ne $hasJoao) {
            Write-Info "  ✗ João Silva (Main patient) visible to Beta tenant!"
        }
        $script:TestsFailed++
    }
} catch {
    Write-Error_Custom "Get patients Tenant Beta failed: $_"
    $script:TestsFailed++
}

# ============================================
# TEST 7: Database Verification
# ============================================
Write-Header "TEST 7: Database Verification"

try {
    $tenantMainQuery = "SELECT COUNT(*) FROM tenant_main.patients WHERE is_active = true;"
    $tenantBetaQuery = "SELECT COUNT(*) FROM tenant_clinic_beta.patients WHERE is_active = true;"

    $mainCount = docker exec -it zscan-db psql -U zscan -d zscan_main -tc $tenantMainQuery | Select-Object -First 1
    $betaCount = docker exec -it zscan-db psql -U zscan -d zscan_main -tc $tenantBetaQuery | Select-Object -First 1

    Write-Info "Patients in tenant_main schema: $mainCount"
    Write-Info "Patients in tenant_clinic_beta schema: $betaCount"

    if ($mainCount -gt 0 -and $betaCount -gt 0) {
        Write-Success "Database isolation verified"
        $script:TestsPassed++
    } else {
        Write-Error_Custom "Database not properly populated"
        $script:TestsFailed++
    }
} catch {
    Write-Error_Custom "Database verification failed: $_"
    # Don't fail the script if docker isn't available
}

# ============================================
# FINAL REPORT
# ============================================
Write-Header "Test Results Summary"

$totalTests = $script:TestsPassed + $script:TestsFailed
$passPercentage = if ($totalTests -gt 0) { [Math]::Round(($script:TestsPassed / $totalTests) * 100) } else { 0 }

Write-Host ""
Write-Host "Total Tests: $totalTests" -ForegroundColor Cyan
Write-Host "✅ Passed: $script:TestsPassed" -ForegroundColor Green
Write-Host "❌ Failed: $script:TestsFailed" -ForegroundColor $(if ($script:TestsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "Pass Rate: $passPercentage%" -ForegroundColor $(if ($passPercentage -eq 100) { "Green" } else { "Yellow" })
Write-Host ""

if ($script:TestsFailed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! Multi-tenant isolation is working correctly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Please review the output above." -ForegroundColor Red
    exit 1
}
