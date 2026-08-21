package handlers

import (
	"fmt"
	"net/http"

	"backend/ws"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WSHandler struct{}

func NewWSHandler() *WSHandler {
	return &WSHandler{}
}

func (h *WSHandler) ServeWS(c *gin.Context) {
	conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("[WEBSOCKET ERROR] Upgrade failed:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upgrade to websocket"})
		return
	}

	ws.GlobalHub.Register(conn)

	// Keep-alive read loop to handle disconnections
	go func() {
		defer ws.GlobalHub.Unregister(conn)
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					fmt.Println("[WEBSOCKET DISCONNECT]:", err)
				}
				break
			}
		}
	}()
}
