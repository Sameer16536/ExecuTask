package service

import (
	"fmt"

	"github.com/Sameer16536/ExecuTask/internal/lib/aws"
	"github.com/Sameer16536/ExecuTask/internal/lib/job"
	"github.com/Sameer16536/ExecuTask/internal/repository"
	"github.com/Sameer16536/ExecuTask/internal/server"
)

type Services struct {
	Auth     *AuthService
	Job      *job.JobService
	Category *CategoryService
	Comment  *CommentService
	Todo     *TodoService
}

func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
	authService := NewAuthService(s)

	// s.Job.SetAuthService(authService)

	awsClient, err := aws.NewAWS(s)
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS client: %w", err)
	}

	return &Services{
		Job:      s.Job,
		Auth:     authService,
		Category: NewCategoryService(s, repos.Category),
		Comment:  NewCommentService(s, repos.Comment, repos.Todo),
		Todo:     NewTodoService(s, repos.Todo, repos.Category, awsClient),
	}, nil
}
