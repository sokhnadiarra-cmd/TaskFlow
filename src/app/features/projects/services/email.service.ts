import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

/**
 * Configuration EmailJS.
 * ⚠️ Ces valeurs viennent du dashboard EmailJS.
 * En production, elles devraient être dans un fichier d'environnement.
 */
const EMAILJS_SERVICE_ID = 'service_po75huk';   
const EMAILJS_TEMPLATE_ID = 'template_eqtrfex'; 
const EMAILJS_PUBLIC_KEY = 'wG1EOQ08IWdgRxNqm';   

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  /**
   * Envoie l'email de réinitialisation via EmailJS.
   * Retourne une promesse qui se résout quand l'email est parti.
   */
  sendPasswordReset(toEmail: string, toName: string, resetLink: string): Promise<void> {
    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      reset_link: resetLink,
    };

    return emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, {
        publicKey: EMAILJS_PUBLIC_KEY,
      })
      .then((response) => {
        console.log('✅ Email envoyé', response.status, response.text);
      })
      .catch((error) => {
        console.error('❌ Échec envoi email', error);
        throw error;
      });
  }
}