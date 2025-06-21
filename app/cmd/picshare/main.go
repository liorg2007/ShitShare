package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
)

var (
	uploadsDir = "uploads"
	publicDir  = "public"
	store      = sessions.NewCookieStore([]byte("replace-with-strong-secret"))
)

func main() {
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Fatal(err)
	}
	if err := os.MkdirAll(publicDir, 0755); err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()
	r.HandleFunc("/", homeHandler)
	r.HandleFunc("/upload", uploadHandler).Methods("POST")
	r.HandleFunc("/gallery", galleryHandler)
	r.HandleFunc("/gallery/data", galleryDataHandler)
	r.HandleFunc("/reset", resetHandler)

	r.PathPrefix("/public/").Handler(http.StripPrefix("/public/", http.FileServer(http.Dir(publicDir))))
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir))))

	fmt.Println("📱 PicShare running on http://localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", r))
}

func getSession(r *http.Request) (*sessions.Session, error) {
	return store.Get(r, "picshare-session")
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	sess, _ := getSession(r)
	hasUploaded := sess.Values["hasUploaded"] == true
	success := r.URL.Query().Get("success") == "1"
	imageFiles := getImageFiles()
	galleryExists := len(imageFiles) > 0
	tmpl := template.Must(template.ParseFiles("internal/templates/home.tmpl"))
	tmpl.Execute(w, map[string]interface{}{
		"HasUploaded":   hasUploaded,
		"Success":       success,
		"ImageFiles":    imageFiles,
		"GalleryExists": galleryExists,
	})
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	sess, _ := getSession(r)
	err := r.ParseMultipartForm(12 << 20) // 12MB
	if err != nil {
		http.Error(w, "Invalid form", http.StatusBadRequest)
		return
	}
	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()
	if !strings.HasPrefix(handler.Header.Get("Content-Type"), "image/") {
		http.Error(w, "Only image files are allowed!", http.StatusBadRequest)
		return
	}
	if handler.Size > 10*1024*1024 {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}
	filename := fmt.Sprintf("%d-%d%s", time.Now().UnixMilli(), time.Now().UnixNano()%1e9, filepath.Ext(handler.Filename))
	f, err := os.Create(filepath.Join(uploadsDir, filename))
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer f.Close()
	if _, err := io.Copy(f, file); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	sess.Values["hasUploaded"] = true
	sess.Save(r, w)
	http.Redirect(w, r, "/?success=1", http.StatusSeeOther)
}

func galleryHandler(w http.ResponseWriter, r *http.Request) {
	sess, _ := getSession(r)
	if sess.Values["hasUploaded"] != true {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}
	tmpl := template.Must(template.ParseFiles("internal/templates/gallery.tmpl"))
	tmpl.Execute(w, nil)
}

func galleryDataHandler(w http.ResponseWriter, r *http.Request) {
	sess, _ := getSession(r)
	if sess.Values["hasUploaded"] != true {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit := 12
	imageFiles := getImageFiles()
	totalImages := len(imageFiles)
	totalPages := (totalImages + limit - 1) / limit
	start := (page - 1) * limit
	end := start + limit
	if start > totalImages {
		start = totalImages
	}
	if end > totalImages {
		end = totalImages
	}
	paginated := imageFiles[start:end]
	json.NewEncoder(w).Encode(map[string]interface{}{
		"images":      paginated,
		"currentPage": page,
		"totalPages":  totalPages,
		"totalImages": totalImages,
	})
}

func resetHandler(w http.ResponseWriter, r *http.Request) {
	sess, _ := getSession(r)
	sess.Options.MaxAge = -1
	sess.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func getImageFiles() []string {
	files, err := os.ReadDir(uploadsDir)
	if err != nil {
		return []string{}
	}
	var imageFiles []string
	for _, f := range files {
		if !f.IsDir() {
			ext := strings.ToLower(filepath.Ext(f.Name()))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
				imageFiles = append(imageFiles, f.Name())
			}
		}
	}
	sort.Slice(imageFiles, func(i, j int) bool {
		// Sort by timestamp in filename, most recent first
		tA, _ := strconv.ParseInt(strings.Split(imageFiles[i], "-")[0], 10, 64)
		tB, _ := strconv.ParseInt(strings.Split(imageFiles[j], "-")[0], 10, 64)
		return tB < tA
	})
	return imageFiles
}
