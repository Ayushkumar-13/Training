package services

import (
	"fmt"
	"log"
)

type EmailService struct {
	smtpHost string
	smtpPort string
}

func NewEmailService() *EmailService {
	return &EmailService{
		smtpHost: "smtp.medequip.com",
		smtpPort: "587",
	}
}

// SendOrderConfirmation simulates sending an order confirmation email to hospital procurement
func (s *EmailService) SendOrderConfirmation(userEmail string, orderID int, totalCents int64) error {
	subject := fmt.Sprintf("MedEquip Purchase Order #%d Confirmation", orderID)
	body := fmt.Sprintf("Thank you for your procurement order #%d totaling $%.2f. Our biomedical team is preparing your equipment dispatch.", orderID, float64(totalCents)/100.0)

	log.Printf("[EMAIL NOTIFICATION DISPATCH] To: %s | Subject: %s | Message: %s", userEmail, subject, body)
	return nil
}

// SendStatusUpdateNotification simulates sending a shipping/status update email
func (s *EmailService) SendStatusUpdateNotification(userEmail string, orderID int, status string) error {
	subject := fmt.Sprintf("MedEquip Order #%d Status Update: %s", orderID, status)
	body := fmt.Sprintf("Your medical equipment order #%d has been updated to status: %s.", orderID, status)

	log.Printf("[EMAIL NOTIFICATION DISPATCH] To: %s | Subject: %s | Message: %s", userEmail, subject, body)
	return nil
}
