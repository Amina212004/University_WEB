import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
try:
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
except ValueError:
    SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER", "uniorau@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "uniora2026")

print("--- DIAGNOSTIC SMTP ---")
print(f"SMTP_HOST: {SMTP_HOST}")
print(f"SMTP_PORT: {SMTP_PORT}")
print(f"SMTP_USER: {SMTP_USER}")
print(f"SMTP_PASSWORD: {'Configured (not default)' if SMTP_PASSWORD != 'uniora2026' else 'Default (needs to be changed)'}")

# Target email to test (change to your personal email to check receipt)
test_target_email = SMTP_USER 

msg = MIMEMultipart()
msg['From'] = f"Uniora <{SMTP_USER}>"
msg['To'] = test_target_email
msg['Subject'] = "Test de diagnostic SMTP Uniora"
body = "Ceci est un email de test pour vérifier la configuration SMTP."
msg.attach(MIMEText(body, 'plain'))

try:
    print("\nConnexion au serveur SMTP...")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    server.set_debuglevel(1) # Enable SMTP debug logs
    
    print("Démarrage du chiffrement TLS (starttls)...")
    server.starttls()
    
    print(f"Tentative de connexion (login) avec {SMTP_USER}...")
    server.login(SMTP_USER, SMTP_PASSWORD)
    
    print(f"Envoi de l'e-mail de test à {test_target_email}...")
    server.sendmail(SMTP_USER, test_target_email, msg.as_string())
    server.quit()
    print("\n[SUCCÈS] L'e-mail a été envoyé avec succès !")
except Exception as e:
    print("\n[ERREUR] Échec de l'envoi de l'e-mail :")
    print(e)
