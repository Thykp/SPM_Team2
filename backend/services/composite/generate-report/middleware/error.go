package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Recovery catches any panic, logs it, and returns a JSON 500 error.
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Ensure the panic message is always a string
				var msg string
				switch v := err.(type) {
				case error:
					msg = v.Error()
				default:
					msg = fmt.Sprintf("%v", v)
				}

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": msg,
				})
			}
		}()
		c.Next()
	}
}
