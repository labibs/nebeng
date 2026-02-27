package models

// User represents a user in the system
type User struct {
	ID        string `json:"id"`
	ClerkID   string `json:"clerk_id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
	Phone     string `json:"phone,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
}

// Post represents a travel post
type Post struct {
	ID              string   `json:"id"`
	UserID          string   `json:"user_id"`
	Type            string   `json:"type"`
	FromCity        string   `json:"from_city"`
	ToCity          string   `json:"to_city"`
	TravelDate      string   `json:"travel_date"`
	ItemDescription string   `json:"item_description"`
	Description     string   `json:"description"`
	Fee             float64  `json:"fee"`
	Price           float64  `json:"price"`
	Armada          string   `json:"armada"`
	Location        string   `json:"location"`
	ItemPhoto       string   `json:"item_photo"`
	CreatedAt       string   `json:"created_at"`
	Users           *UserRef `json:"users,omitempty"`
}

type UserRef struct {
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

// Warung represents a store/outlet
type Warung struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Address          string   `json:"address"`
	Category         string   `json:"category"`
	Status           string   `json:"status"`
	CreatedByClerkID string   `json:"created_by_clerk_id"`
	Owner            *UserRef `json:"owner,omitempty"`
}

// Product represents a warung product
type Product struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	EstimatedPrice float64  `json:"estimated_price"`
	ImageURL       string   `json:"image_url"`
	Rating         float64  `json:"rating"`
	IsEstimated    bool     `json:"is_estimated"`
	CreatedAt      string   `json:"created_at"`
	CategoryName   string   `json:"category_name,omitempty"`
	OwnerName      string   `json:"owner_name,omitempty"`
	OwnerAvatar    string   `json:"owner_avatar,omitempty"`
	OwnerID        string   `json:"owner_id,omitempty"`
	WarungName     string   `json:"warung_name,omitempty"`
	WarungStatus   string   `json:"warung_status,omitempty"`
}

// CartItem represents an item in the cart
type CartItem struct {
	ID             string      `json:"id"`
	UserID         string      `json:"user_id"`
	Quantity       int         `json:"quantity"`
	RequestedPrice float64     `json:"requested_price"`
	EstimatedPrice float64     `json:"estimated_price"`
	Notes          string      `json:"notes"`
	Status         string      `json:"status"`
	Product        *ProductRef `json:"product,omitempty"`
	Warung         *WarungRef  `json:"warung,omitempty"`
	Buyer          *UserRef    `json:"buyer,omitempty"`
}

type ProductRef struct {
	Name           string  `json:"name"`
	ImageURL       string  `json:"image_url"`
	EstimatedPrice float64 `json:"estimated_price"`
}

type WarungRef struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Address          string   `json:"address"`
	Category         string   `json:"category"`
	Status           string   `json:"status"`
	CreatedByClerkID string   `json:"created_by_clerk_id"`
	Owner            *UserRef `json:"owner,omitempty"`
}

// Conversation represents a chat conversation
type Conversation struct {
	ConversationID string   `json:"conversationId"`
	Opponent       *UserRef `json:"opponent"`
	LastMessage    string   `json:"lastMessage"`
	LastTime       string   `json:"lastTime"`
	UnreadCount    int      `json:"unreadCount"`
}

// Transaction represents a payment transaction
type Transaction struct {
	ID                string  `json:"id"`
	TransactionStatus string  `json:"transaction_status"`
	GrossAmount       float64 `json:"gross_amount"`
	PaymentType       string  `json:"payment_type"`
	CreatedAt         string  `json:"created_at"`
	Deal              *Deal   `json:"deal,omitempty"`
}

// Deal represents a negotiated deal
type Deal struct {
	ID               string   `json:"id"`
	Status           string   `json:"status"`
	AgreedFee        float64  `json:"agreed_fee"`
	CarrierID        string   `json:"carrier_id"`
	DepositorID      string   `json:"depositor_id"`
	PickupLocation   string   `json:"pickup_location"`
	DeliveryLocation string   `json:"delivery_location"`
	PickupDatetime   string   `json:"pickup_datetime"`
	ItemDescription  string   `json:"item_description"`
	DeliveryStatus   string   `json:"delivery_status"`
	Carrier          *UserRef `json:"carrier,omitempty"`
	Depositor        *UserRef `json:"depositor,omitempty"`
	Post             *PostRef `json:"post,omitempty"`
}

type PostRef struct {
	FromCity   string `json:"from_city"`
	ToCity     string `json:"to_city"`
	Type       string `json:"type"`
	ItemPhoto  string `json:"item_photo"`
	CreatedAt  string `json:"created_at"`
}
