package controller

import (
	"fmt"
	"log"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"project-se/entity"
	"project-se/config"
	"strconv" // เพิ่ม import สำหรับการแปลง uint -> string
	"encoding/json" // เพิ่มส่วนนี้สำหรับ JSON

)

// เก็บการเชื่อมต่อ WebSocket สำหรับแชท
var chatRooms = make(map[string]map[*websocket.Conn]string) // map[bookingID] -> map[conn]role


// อัปเกรด HTTP เป็น WebSocket
var chatupgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // อนุญาตทุก Origin (เฉพาะสำหรับการพัฒนา)
	},
}

// เพิ่มการเชื่อมต่อห้องแชท
func addChatConnection(bookingID string, conn *websocket.Conn, role string) {
    if _, exists := chatRooms[bookingID]; !exists {
        chatRooms[bookingID] = make(map[*websocket.Conn]string)
        log.Printf("⚙️ Created new chat room: %s", bookingID)
    }

    // ตรวจสอบว่ามีการเชื่อมต่อเดิมหรือไม่
    for existingConn, existingRole := range chatRooms[bookingID] {
        if existingConn == conn && existingRole == role {
            log.Printf("⚠️ Connection already exists for %s in room %s", role, bookingID)
            return
        }
    }

    chatRooms[bookingID][conn] = role
    fmt.Printf("✅ %s connected to chat room %s\n", role, bookingID)
    fmt.Printf("📋 Current Chat Rooms: %+v\n", chatRooms)
}






// ลบการเชื่อมต่อห้องแชท
func removeChatConnection(bookingID string, conn *websocket.Conn) {
	if _, exists := chatRooms[bookingID]; exists {
		delete(chatRooms[bookingID], conn)
		if len(chatRooms[bookingID]) == 0 {
			delete(chatRooms, bookingID)
		}
		fmt.Printf("❌ Connection removed from chat room %s\n", bookingID)
	}
}

// ส่งข้อความในห้องแชท
func broadcastChatMessage(bookingID string, message []byte, senderRole string) {
	if _, exists := chatRooms[bookingID]; !exists {
		log.Printf("❌ Chat room %s does not exist\n", bookingID)
		
		return
	}

	for conn, role := range chatRooms[bookingID] {
		if role != senderRole { // ส่งข้อความถึงฝ่ายตรงข้ามเท่านั้น
			err := conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Println("❌ Error sending chat message:", err)
				removeChatConnection(bookingID, conn)
			}
		}
	}

	
}

// Handler สำหรับ Passenger
func PassengerWebSocketHandler(c *gin.Context) {
	bookingID := c.Param("bookingID")

	conn, err := chatupgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("❌ Failed to upgrade WebSocket connection:", err)
		return
	}
	defer conn.Close()

	addChatConnection(bookingID, conn, "passenger")
	log.Printf("✅ Passenger connected to chat room %s", bookingID)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("❌ Error reading message from passenger:", err)
			removeChatConnection(bookingID, conn)
			break
		}
		log.Printf("📩 Passenger Message [%s]: %s", bookingID, string(msg))
		broadcastChatMessage(bookingID, msg, "passenger")
	}
}


// Handler สำหรับ Driver
func DriverChatWebSocketHandler(c *gin.Context) {
	bookingID := c.Param("bookingID")

	conn, err := chatupgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("❌ Failed to upgrade WebSocket connection:", err)
		return
	}
	defer conn.Close()

	addChatConnection(bookingID, conn, "driver")
	log.Printf("✅ Driver connected to chat room %s", bookingID)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("❌ Error reading message from driver:", err)
			removeChatConnection(bookingID, conn)
			break
		}
		log.Printf("📩 Driver Message [%s]: %s", bookingID, string(msg))
		broadcastChatMessage(bookingID, msg, "driver")
	}
}


	

// ส่งข้อความอัปเดตในห้องแชท
func broadcastChatUpdateMessage(bookingID string, updatePayload []byte, senderRole string) {
    if _, exists := chatRooms[bookingID]; !exists {
        log.Printf("❌ Chat room %s does not exist. Skipping broadcast.\n", bookingID)
        return
    }

    log.Printf("📤 Broadcasting update in chat room: %s, Sender Role: %s", bookingID, senderRole)
    log.Printf("📤 Payload: %s", string(updatePayload))

    for conn, role := range chatRooms[bookingID] {
        log.Printf("🔗 Connection Role: %s", role)
        if role != senderRole { // ส่งข้อความถึงฝ่ายตรงข้ามเท่านั้น
            err := conn.WriteMessage(websocket.TextMessage, updatePayload)
            if err != nil {
                log.Printf("❌ Error sending updated message to %s: %v", role, err)
                removeChatConnection(bookingID, conn)
            } else {
                log.Printf("✅ Message sent to %s in room %s", role, bookingID)
            }
        } else {
            log.Printf("⏩ Skipped sending to sender role: %s", role)
        }
    }
}




func UpdateMessage(c *gin.Context) {
	messageID := c.Param("id")
	var message entity.Message
	var updates struct {
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ค้นหาและอัปเดตข้อความในฐานข้อมูล
	if err := config.DB().First(&message, "id = ?", messageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	if updates.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content cannot be empty"})
		return
	}

	message.Content = updates.Content
	if err := config.DB().Model(&message).Update("content", message.Content).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ส่งข้อมูลอัปเดตกลับไปยัง Client ที่เรียก
	c.JSON(http.StatusOK, gin.H{"data": message})

	// เตรียม Payload สำหรับ Broadcast การอัปเดต
	updatePayload := map[string]interface{}{
		"type":       "update_message",
		"message_id": message.ID,
		"content":    message.Content,
		"timestamp":  message.UpdatedAt,
	}

	// แปลง Payload เป็น JSON
	payloadBytes, err := json.Marshal(updatePayload)
	if err != nil {
		log.Println("❌ Failed to marshal update payload:", err)
		return
	}
	fmt.Println("Update Request Received:", messageID, updates.Content)
	fmt.Println("Broadcasting Update:", updatePayload)

	// **ใช้ bookingId ในการเชื่อมโยง**
	roomIDString := strconv.FormatUint(uint64(message.BookingID), 10)

	// Broadcast ข้อมูลไปยัง RoomID ที่เกี่ยวข้อง
	broadcastChatUpdateMessage(roomIDString, payloadBytes, message.SenderType)
}
