package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// Unit test for GET /api/users
func TestGetUsers_ReturnsList(t *testing.T) {
	r := gin.New()
	r.GET("/api/users", GetUsers)

	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("want 200, got %d, body=%q", rr.Code, rr.Body.String())
	}

	var body map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("response not valid JSON: %v", err)
	}
	if _, ok := body["data"]; !ok {
		t.Fatalf("expected 'data' field in response, got: %v", body)
	}
}

// Unit test for POST /api/users (success + validation)
func TestCreateUser_SuccessAndValidation(t *testing.T) {
	r := gin.New()
	r.POST("/api/users", CreateUser)

	// Successful create
	payload := []byte(`{"name":"Charlie"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("want 201 Created, got %d, body=%q", rr.Code, rr.Body.String())
	}

	var created map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
		t.Fatalf("response not valid JSON: %v", err)
	}
	if _, ok := created["data"]; !ok {
		t.Fatalf("expected 'data' field in create response, got: %v", created)
	}

	// Validation failure (missing name)
	badReq := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewReader([]byte(`{}`)))
	badReq.Header.Set("Content-Type", "application/json")
	badRR := httptest.NewRecorder()
	r.ServeHTTP(badRR, badReq)

	if badRR.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing name, got %d, body=%q", badRR.Code, badRR.Body.String())
	}
}

// Unit test for POST /api/users/getUserDetails with an empty array (binding path)
func TestGetUserByID_WithEmptyArray(t *testing.T) {
	r := gin.New()
	r.POST("/api/users/getUserDetails", GetUserByID)

	req := httptest.NewRequest(http.MethodPost, "/api/users/getUserDetails", bytes.NewReader([]byte(`[]`)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("want 200 OK, got %d, body=%q", rr.Code, rr.Body.String())
	}

	// Response should be valid JSON (likely an empty array)
	var out interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &out); err != nil {
		t.Fatalf("response not valid JSON: %v", err)
	}
}
