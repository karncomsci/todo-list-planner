package httpapi

import (
	"errors"
	"log/slog"

	"github.com/gofiber/fiber/v3"
)

// Error is the single error shape every endpoint returns (D15).
// Field names the request field that failed validation and is empty otherwise.
type Error struct {
	Status  int    `json:"-"`
	Code    string `json:"code"`
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}

func (e *Error) Error() string { return e.Message }

// validation reports a request field that failed a rule (D15). code names the
// rule, such as "required", so the web can word the Thai message precisely.
func validation(field, code, message string) *Error {
	return &Error{Status: fiber.StatusUnprocessableEntity, Code: code, Message: message, Field: field}
}

var errBadJSON = &Error{Status: fiber.StatusBadRequest, Code: "bad_request", Message: "request body must be a JSON object"}

// handleError renders every error returned by a handler as {"error": Error}.
func handleError(c fiber.Ctx, err error) error {
	var apiErr *Error
	var fiberErr *fiber.Error
	switch {
	case errors.As(err, &apiErr):
	case errors.As(err, &fiberErr):
		apiErr = &Error{Status: fiberErr.Code, Code: codeForStatus(fiberErr.Code), Message: fiberErr.Message}
	default:
		slog.Error("unhandled request error", "method", c.Method(), "path", c.Path(), "error", err)
		apiErr = &Error{Status: fiber.StatusInternalServerError, Code: "internal", Message: "unexpected server error"}
	}
	return c.Status(apiErr.Status).JSON(fiber.Map{"error": apiErr})
}

func codeForStatus(status int) string {
	switch status {
	case fiber.StatusBadRequest:
		return "bad_request"
	case fiber.StatusUnauthorized:
		return "unauthorized"
	case fiber.StatusNotFound:
		return "not_found"
	case fiber.StatusMethodNotAllowed:
		return "method_not_allowed"
	case fiber.StatusRequestEntityTooLarge:
		return "payload_too_large"
	case fiber.StatusUnsupportedMediaType:
		return "unsupported_media_type"
	case fiber.StatusTooManyRequests:
		return "too_many_attempts"
	}
	if status >= 500 {
		return "internal"
	}
	return "bad_request"
}
