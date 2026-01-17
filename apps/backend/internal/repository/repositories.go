package repository

import "github.com/Sameer16536/ExecuTask/internal/server"

type Repositories struct{}

func NewRepositories(s *server.Server) *Repositories {
	return &Repositories{}
}
