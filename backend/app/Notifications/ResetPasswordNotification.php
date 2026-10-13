<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Email atur ulang password dalam bahasa yang sedang dipakai user.
 * Link menuju halaman frontend, bukan route web Laravel.
 */
class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
        $expire = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject(__('messages.reset_mail_subject'))
            ->greeting(__('messages.reset_mail_greeting', ['name' => $notifiable->name]))
            ->line(__('messages.reset_mail_line'))
            ->action(__('messages.reset_mail_action'), $url)
            ->line(__('messages.reset_mail_expire', ['count' => $expire]))
            ->line(__('messages.reset_mail_ignore'))
            ->salutation('Pidu');
    }
}
