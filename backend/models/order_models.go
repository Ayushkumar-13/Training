package models

import "time"

type Order struct {
	ID                 int        `json:"id"`
	UserID             int        `json:"user_id"`
	UserEmail          string     `json:"user_email,omitempty"`
	TotalCents         int64      `json:"total_cents"`
	Currency           string     `json:"currency"`
	Status             string     `json:"status"`
	ShippingAddress    string     `json:"shipping_address"`
	City               string     `json:"city"`
	State              string     `json:"state"`
	PostalCode         string     `json:"postal_code"`
	Phone              string     `json:"phone"`
	PaymentMethod      string     `json:"payment_method"`
	PaymentReceiptNo   string     `json:"payment_receipt_no,omitempty"`
	PaymentStatus      string     `json:"payment_status,omitempty"`
	RefundStatus       string     `json:"refund_status,omitempty"`
	RefundID           string     `json:"refund_id,omitempty"`
	RefundedAt         *time.Time `json:"refunded_at,omitempty"`
	CancellationReason string     `json:"cancellation_reason,omitempty"`
	ReturnStatus       string     `json:"return_status,omitempty"`
	ReturnReason       string     `json:"return_reason,omitempty"`
	ReturnedAt         *time.Time `json:"returned_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	Items              []OrderItem `json:"items,omitempty"`
	Payment            *Payment   `json:"payment,omitempty"`
}

type OrderItem struct {
	ID           int    `json:"id"`
	OrderID      int    `json:"order_id"`
	ProductID    int    `json:"product_id"`
	ProductName  string `json:"product_name,omitempty"`
	ProductSKU   string `json:"product_sku,omitempty"`
	ProductImage string `json:"product_image,omitempty"`
	Quantity     int    `json:"quantity"`
	UnitCents    int64  `json:"unit_cents"`
}

type Payment struct {
	ID                int       `json:"id"`
	OrderID           int       `json:"order_id"`
	Provider          string    `json:"provider"`
	ProviderPaymentID string    `json:"provider_payment_id"`
	Status            string    `json:"status"`
	AmountCents       int64     `json:"amount_cents"`
	CreatedAt         time.Time `json:"created_at"`
}

type CreateOrderRequest struct {
	PaymentMethod    string `json:"payment_method"` // "online", "cod", "hospital_po"
	PaymentReceiptNo string `json:"payment_receipt_no"`
	ShippingAddress  string `json:"shipping_address"`
	City             string `json:"city"`
	State            string `json:"state"`
	PostalCode       string `json:"postal_code"`
	Phone            string `json:"phone"`
}
