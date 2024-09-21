package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"time"
)

type ExecutionReq struct {
	Code       string `json:"code"`
	Predicates []struct {
		Name       string `json:"name"`
		Expression string `json:"expression"`
	} `json:"predicates"`
}

type ExecutionResp struct {
	Traces []string `json:"traces"`
}

func promelaExecution(w http.ResponseWriter, r *http.Request) {
	req := &ExecutionReq{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return
	}

	response := ExecutionResp{Traces: make([]string, len(req.Predicates))}
	for i, predicate := range req.Predicates {
		cmd := exec.Command("bash", "./promela.sh")
		stdin, _ := cmd.StdinPipe()

		go func() {
			defer stdin.Close()
			formula := fmt.Sprintf("ltl %s { %s }\n", predicate.Name, predicate.Expression)
			stdin.Write([]byte(req.Code + "\n" + formula))
		}()

		b, _ := cmd.CombinedOutput()
		response.Traces[i] = string(b)
	}

	json.NewEncoder(w).Encode(response)
}

func setupRoutes() http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/", http.FileServer(http.Dir("../static")))
	mux.HandleFunc("/run", promelaExecution)

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
