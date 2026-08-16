package internal

import (
	"context"
	"sync"

	"github.com/coder/websocket"
)

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*Client]struct{}),
	}
}

func (h *Hub) Register(userID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[userID]; !ok {
		h.clients[userID] = make(map[*Client]struct{})
	}

	h.clients[userID][client] = struct{}{}
}

func (h *Hub) Unregister(userID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	clients, ok := h.clients[userID]
	if !ok {
		return
	}

	if _, ok := clients[client]; !ok {
		return
	}

	delete(clients, client)
	close(client.send)

	if len(clients) == 0 {
		delete(h.clients, userID)
	}
}

func (h *Hub) SendToUser(userID string, payload []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients, ok := h.clients[userID]
	if !ok {
		return
	}

	for client := range clients {
		msg := append([]byte(nil), payload...)

		select {
		case client.send <- msg:
		default:
			// Client queue is full.
			// Drop the message instead of blocking.
		}
	}
}

func (h *Hub) Broadcast(payload []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, clients := range h.clients {
		for client := range clients {
			msg := append([]byte(nil), payload...)

			select {
			case client.send <- msg:
			default:
				// Client queue is full.
				// Drop the message instead of blocking.
			}
		}
	}
}

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

func NewClient(conn *websocket.Conn) *Client {
	return &Client{
		conn: conn,
		send: make(chan []byte, 32),
	}
}

func (c *Client) WriteLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return

		case msg, ok := <-c.send:
			if !ok {
				return
			}

			if err := c.conn.Write(
				ctx,
				websocket.MessageText,
				msg,
			); err != nil {
				return
			}
		}
	}
}
