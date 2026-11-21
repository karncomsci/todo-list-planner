package httpapi

import (
	"fmt"

	"github.com/gofiber/fiber/v3"

	"planner-api/internal/auth"
	"planner-api/internal/database"
)

// maxPasswordBytes is the most bcrypt reads; a longer password would be cut silently.
const maxPasswordBytes = 72

// changePassword sets a new password after the current one is confirmed
// (story 54, D18). Every other session of the Owner ends; this one stays (D17).
func (s *server) changePassword(c fiber.Ctx) error {
	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return errBadJSON
	}
	if req.CurrentPassword == "" {
		return validation("currentPassword", "required", "currentPassword is required")
	}
	switch {
	case req.NewPassword == "":
		return validation("newPassword", "required", "newPassword is required")
	case len([]rune(req.NewPassword)) < auth.MinPasswordLength:
		return validation("newPassword", "too_short", fmt.Sprintf("newPassword must be at least %d characters", auth.MinPasswordLength))
	case len(req.NewPassword) > maxPasswordBytes:
		return validation("newPassword", "too_long", fmt.Sprintf("newPassword must be at most %d bytes", maxPasswordBytes))
	}

	owner := currentOwnerOf(c).ID
	hash, err := s.queries.GetOwnerPasswordHash(c.Context(), owner)
	if err != nil {
		return err
	}
	if !auth.PasswordMatches(hash, req.CurrentPassword) {
		return validation("currentPassword", "incorrect", "the current password is wrong")
	}
	newHash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}
	keep := auth.HashToken(c.Cookies(sessionCookie))
	if err := s.inTx(c, func(q *database.Queries) error {
		if err := q.SetOwnerPassword(c.Context(), database.SetOwnerPasswordParams{ID: owner, PasswordHash: newHash}); err != nil {
			return err
		}
		return q.DeleteOtherSessions(c.Context(), database.DeleteOtherSessionsParams{OwnerID: owner, KeepTokenHash: keep})
	}); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
