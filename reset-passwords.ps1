# Reset all user passwords via Supabase Admin REST API directly
$url = "https://acrzypzzbbkdisietjlf.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcnp5cHp6YmJrZGlzaWV0amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2OTU3OSwiZXhwIjoyMDg2NTQ1NTc5fQ.5Pe76BjRGllmCRn9-tSzveVg8b_4Cqk1xk4YQBaO14g"

$headers = @{
    "apikey"        = $key
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
}

$users = @(
    @{ id = "e1b7791a-aa41-4221-9a6a-f87ae4c3fb21"; email = "richkevonlinestore@gmail.com";       password = "RichKev2026!" },
    @{ id = "2bc8c483-c027-4a02-a128-3065b33ed6c8"; email = "johnnynjsh@gmail.com";               password = "Johnny2026!" },
    @{ id = "e1b9eefe-c6c6-41ad-b208-6e5e17ed9ff6"; email = "cloud@techlabenterprises.com";       password = "CloudTech2026!" },
    @{ id = "089a63f0-547c-4440-ae01-2f3f51cfc2ed"; email = "sadiyafarah@starbridgetutoring.com"; password = "Sadiya2026!" },
    @{ id = "79971e4f-f7c0-4b55-a647-916f9cca20bb"; email = "knet7763@gmail.com";                 password = "Knet2026!" }
)

Write-Host "Starting password reset via Admin REST API...`n"

foreach ($user in $users) {
    $body = @{ password = $user.password } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod `
            -Uri "$url/auth/v1/admin/users/$($user.id)" `
            -Method PUT `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        Write-Host "OK  $($user.email)  ->  $($user.password)"
    } catch {
        $errBody = $_.ErrorDetails.Message
        Write-Host "FAILED  $($user.email): $errBody"
    }
}

Write-Host "`nDone!"
