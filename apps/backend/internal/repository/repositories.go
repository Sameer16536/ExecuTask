package repository

import "github.com/Sameer1636/go-executask/internal/server"

type Repositories struct{}

func NewRepositories(s *server.Server) *Repositories {
	return &Repositories{}
}
