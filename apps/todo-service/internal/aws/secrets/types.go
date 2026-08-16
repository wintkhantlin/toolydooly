package secrets

type Database struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	Database string `json:"database"`
}

type Queue struct {
	QueueURL string `json:"queue_url"`
	Region   string `json:"region"`
}
