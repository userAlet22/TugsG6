<!DOCTYPE html>
<html>
<head>
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Password Reset Request</h2>
    <p>Hello,</p>
    <p>You are receiving this email because we received a password reset request for your account.</p>
    <p>Click the link below to reset your password. This link will expire in 30 minutes.</p>
    
    <p>
        <a href="gsomobileapp://reset-password?token={{ $token }}" 
           style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">
            Reset Password
        </a>
    </p>

    <p>If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser or app:</p>
    <p><a href="gsomobileapp://reset-password?token={{ $token }}">gsomobileapp://reset-password?token={{ $token }}</a></p>

    <p>If you did not request a password reset, no further action is required.</p>
    <br>
    <p>Regards,<br>GSO System Team</p>
</body>
</html>
