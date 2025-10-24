package test

import (
	"testing"

	"generate-report/routers"

	"github.com/stretchr/testify/assert"
)

func TestRegisterSystemRoutes(t *testing.T) {
	r := routers.RegisterSystemRoutes(nil)
	assert.NotNil(t, r)
}
