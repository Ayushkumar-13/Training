package ws

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all frontend and admin origins
	},
}

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type Hub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan Event
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mu         sync.Mutex
}

var GlobalHub = NewHub()

func NewHub() *Hub {
	h := &Hub{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan Event, 100),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
	go h.run()
	return h
}

func (h *Hub) run() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			h.clients[conn] = true
			h.mu.Unlock()
			fmt.Println("[WEBSOCKET ENGINE] New Client Connected. Total Clients:", len(h.clients))

		case conn := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[conn]; ok {
				delete(h.clients, conn)
				conn.Close()
				fmt.Println("[WEBSOCKET ENGINE] Client Disconnected. Remaining Clients:", len(h.clients))
			}
			h.mu.Unlock()

		case event := <-h.broadcast:
			h.mu.Lock()
			msgBytes, err := json.Marshal(event)
			if err == nil {
				for conn := range h.clients {
					err := conn.WriteMessage(websocket.TextMessage, msgBytes)
					if err != nil {
						conn.Close()
						delete(h.clients, conn)
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) Register(conn *websocket.Conn) {
	h.register <- conn
}

func (h *Hub) Unregister(conn *websocket.Conn) {
	h.unregister <- conn
}

func BroadcastEvent(eventType string, payload interface{}) {
	fmt.Printf("[WEBSOCKET BROADCAST] Event: '%s' Payload: %+v\n", eventType, payload)
	GlobalHub.broadcast <- Event{
		Type:    eventType,
		Payload: payload,
	}
}
