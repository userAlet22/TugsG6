<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>GSO System Notification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #004a99;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h2 {
            color: #004a99;
            margin: 0;
        }
        .content {
            margin-bottom: 30px;
        }
        .footer {
            font-size: 12px;
            color: #777;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            background-color: #e3f2fd;
            color: #0d47a1;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>GSO Maintenance System</h2>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $notification->user->full_name ?? 'User' }}</strong>,</p>
            
            <p>There is a new update regarding your request:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #004a99; margin: 20px 0;">
                {{ $notification->message }}
            </div>

            <p><span class="badge">{{ str_replace('_', ' ', $notification->type) }}</span></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from the GSO Management System.<br>
            Please do not reply directly to this email.</p>
            <p>&copy; {{ date('Y') }} GSO System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
