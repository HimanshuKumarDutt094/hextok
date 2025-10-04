package hexes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// ListHexesHandler returns all hex colors.
func (h *Handler) listHexesHandler(w http.ResponseWriter, r *http.Request) {
	data, err := h.hexStore.ListAllHexColors(r.Context())
	if err != nil {
		http.Error(w, "failed to get colors", http.StatusInternalServerError)
		return
	}
	users := make([]HexResponse, 0, len(data))
	for _, v := range data {
		users = append(users, HexResponse{
			Id:       v.Id,
			HexValue: v.HexValue,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "failed to encode", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) getHexHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/hexes/")
	if len(idStr) == 0 {
		http.Error(w, "no id povided", http.StatusBadRequest)
		return
	}
	hexId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "id failed to parse", http.StatusBadRequest)
		return
	}
	res, err := h.hexStore.GetHexById(r.Context(), hexId)
	if err != nil {
		http.Error(w, "no hex found", http.StatusNoContent)
		return
	}
	hexRes := HexResponse{
		Id:       res.Id,
		HexValue: res.HexValue,
	}
	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(hexRes); err != nil {
		http.Error(w, "failed to encode data", http.StatusInternalServerError)
		return
	}
}

// CreateHexHandler creates a new hex color (optional).
func (h *Handler) createHexHandler(w http.ResponseWriter, r *http.Request) {
	var body NewHexRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(&body); err != nil {
		http.Error(w, "false body", http.StatusBadRequest)
		return
	}
	res, err := h.hexStore.CreateHex(r.Context(), body.HexValue)
	if err != nil {
		http.Error(w, "failed to create", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	hex := HexResponse{
		Id:       res,
		HexValue: body.HexValue,
	}
	json.NewEncoder(w).Encode(hex)
}
