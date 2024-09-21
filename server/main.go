package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"time"
)

func setupRoutes() http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/", http.FileServer(http.Dir("../static")))

	return mux
}

func main() {
	server := &http.Server{
		Addr:    ":8080",
		Handler: setupRoutes(),
	}

	go func() {
		server.ListenAndServe()
	}()
	fmt.Println("Server started on port 8080")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, os.Kill)

	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	server.Shutdown(ctx)
}
