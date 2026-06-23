package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Challenge struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Difficulty  string   `json:"difficulty"`
	Points      int      `json:"points"`
	Flag        string   `json:"flag"`
	Hints       []string `json:"hints"`
	Network     string   `json:"network"`
	Targets     []string `json:"targets"`
	Order       int      `json:"order"` // 渗透顺序
}

type Progress struct {
	UserID          string                 `json:"user_id"`
	CompletedChallenges []int              `json:"completed_challenges"`
	TotalScore      int                    `json:"total_score"`
	StartTime       time.Time              `json:"start_time"`
	LastUpdate      time.Time              `json:"last_update"`
	SubmissionHistory []Submission         `json:"submission_history"`
}

type Submission struct {
	ChallengeID int       `json:"challenge_id"`
	Flag        string    `json:"flag"`
	Correct     bool      `json:"correct"`
	Timestamp   time.Time `json:"timestamp"`
}

type NetworkNode struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	IP       string   `json:"ip"`
	Services []string `json:"services"`
	Network  string   `json:"network"`
	Status   string   `json:"status"` // unknown, discovered, compromised
}

type NetworkTopology struct {
	Nodes []NetworkNode   `json:"nodes"`
	Edges []NetworkEdge   `json:"edges"`
}

type NetworkEdge struct {
	From   string `json:"from"`
	To     string `json:"to"`
	Access string `json:"access"` // allowed, blocked, vpn
}

var challenges = []Challenge{
	{
		ID:          1,
		Name:        "DMZ 侦察",
		Description: "扫描 DMZ 区，发现 Web 服务器并获取第一个 flag",
		Difficulty:  "Easy",
		Points:      100,
		Flag:        "FSCAN_LAB{w3b_f1ng3rpr1nt_d1sc0v3ry}",
		Hints:       []string{"扫描 10.10.1.0/24 网段", "寻找 Tomcat 服务", "flag 在 webapps/ROOT/flag1.txt"},
		Network:     "dmz",
		Targets:     []string{"10.10.1.10"},
		Order:       1, // 第一步：外网扫描 DMZ
	},
	{
		ID:          2,
		Name:        "FTP 弱密码",
		Description: "通过 FTP 弱密码进入 DMZ 区并获取 SSH 密钥",
		Difficulty:  "Easy",
		Points:      150,
		Flag:        "FSCAN_LAB{ftp_w34k_p4ssw0rd_pwn}",
		Hints:       []string{"FTP 服务在 10.10.1.12", "尝试 admin/123456", "查看 .ssh 目录"},
		Network:     "dmz",
		Targets:     []string{"10.10.1.12"},
		Order:       2, // 第二步：FTP 获取 SSH 密钥
	},
	{
		ID:          3,
		Name:        "VPN 网关突破",
		Description: "使用获取的 SSH 密钥连接 VPN 网关进入办公网。提供两种渗透方法：(1) 直接上传 fscan 到 VPN 网关扫描办公网；(2) 使用 SSH 动态端口转发建立 SOCKS5 代理，在 Attacker 机器上通过代理扫描。详见 /root/docs/penetration-guide.md",
		Difficulty:  "Medium",
		Points:      200,
		Flag:        "FSCAN_LAB{vpn_g4t3w4y_br34ch3d}",
		Hints:       []string{
			"使用 office_key 连接 10.10.1.13",
			"VPN 网关有两个网卡：10.10.1.13(DMZ) 和 10.10.2.2(办公网)",
			"flag 在 /etc/flag3.txt",
			"方法1: scp fscan 到网关，然后 ssh 登录扫描",
			"方法2: ssh -D 1080 建立SOCKS5隧道，fscan -socks5 127.0.0.1:1080 -np",
		},
		Network:     "dmz",
		Targets:     []string{"10.10.1.13"},
		Order:       3, // 第三步：进入办公网
	},
	{
		ID:          4,
		Name:        "办公网备份服务器",
		Description: "发现 Rsync 备份服务器并获取敏感文件",
		Difficulty:  "Medium",
		Points:      250,
		Flag:        "FSCAN_LAB{rsync_b4ckup_l34k}",
		Hints:       []string{"扫描办公网 873 端口", "Rsync 可能未授权访问", "备份目录: rsync://10.10.2.22/backup"},
		Network:     "office",
		Targets:     []string{"10.10.2.22"},
		Order:       7, // 办公网探索，获取 Redis 密码
	},
	{
		ID:          5,
		Name:        "生产网 Redis 渗透",
		Description: "利用 Redis 弱密码获取 flag 并准备横向移动",
		Difficulty:  "Hard",
		Points:      300,
		Flag:        "FSCAN_LAB{r3d1s_un4uth0r1z3d_4cc3ss}",
		Hints:       []string{"从备份文件获取 Redis 密码", "连接 10.10.3.31", "GET flag5"},
		Network:     "production",
		Targets:     []string{"10.10.3.31"},
		Order:       8, // 进入生产网
	},
	{
		ID:          6,
		Name:        "核心网 MySQL 数据库",
		Description: "爆破 MySQL 数据库获取敏感信息",
		Difficulty:  "Hard",
		Points:      350,
		Flag:        "FSCAN_LAB{mysql_d4t4b4s3_pwn3d}",
		Hints:       []string{"从生产网扫描核心网 3306 端口", "尝试 root/Password", "SELECT flag FROM secrets.flags"},
		Network:     "core",
		Targets:     []string{"10.10.4.40"},
		Order:       10, // 核心网数据库，获取 Mongo 凭证
	},
	{
		ID:          7,
		Name:        "最终目标 - MongoDB",
		Description: "攻陷 MongoDB 获取最终 flag，完成整个网络渗透",
		Difficulty:  "Expert",
		Points:      500,
		Flag:        "FSCAN_LAB{y0u_pwn3d_th3_n3tw0rk}",
		Hints:       []string{"从 MySQL 获取 MongoDB 凭证", "连接 10.10.4.43", "查询 admin_secrets 集合"},
		Network:     "core",
		Targets:     []string{"10.10.4.43"},
		Order:       13, // 最终目标
	},
	{
		ID:          8,
		Name:        "Elasticsearch 情报收集",
		Description: "利用 Elasticsearch 未授权访问获取生产网敏感信息",
		Difficulty:  "Medium",
		Points:      200,
		Flag:        "FSCAN_LAB{3l4st1cs34rch_un4uth0r1z3d}",
		Hints:       []string{"扫描生产网 9200 端口", "Elasticsearch 默认无认证", "GET /_cat/indices 查看索引"},
		Network:     "production",
		Targets:     []string{"10.10.3.34"},
		Order:       9, // 生产网情报收集
	},
	{
		ID:          9,
		Name:        "PostgreSQL 数据库渗透",
		Description: "爆破 PostgreSQL 数据库获取业务数据",
		Difficulty:  "Hard",
		Points:      300,
		Flag:        "FSCAN_LAB{p0stgr3s_d4t4b4s3_pwn3d}",
		Hints:       []string{"扫描核心网 5432 端口", "尝试 postgres/postgres123", "SELECT * FROM business.secrets"},
		Network:     "core",
		Targets:     []string{"10.10.4.42"},
		Order:       11, // 核心网数据库探索
	},
	{
		ID:          10,
		Name:        "MSSQL 数据库攻击",
		Description: "攻破 MSSQL 数据库获取企业核心数据",
		Difficulty:  "Hard",
		Points:      300,
		Flag:        "FSCAN_LAB{mssql_s4_4cc0unt_pwn3d}",
		Hints:       []string{"扫描核心网 1433 端口", "尝试 sa/P@ssword123", "SELECT * FROM master.dbo.secrets"},
		Network:     "core",
		Targets:     []string{"10.10.4.41"},
		Order:       12, // 核心网数据库探索
	},
	{
		ID:          11,
		Name:        "VNC 远程桌面入侵",
		Description: "通过 VNC 弱密码获取办公网主机控制权",
		Difficulty:  "Medium",
		Points:      200,
		Flag:        "FSCAN_LAB{vnc_r3m0t3_d3skt0p_pwn3d}",
		Hints:       []string{"扫描办公网 5901 端口", "VNC 密码: password", "flag 在桌面 flag11.txt"},
		Network:     "office",
		Targets:     []string{"10.10.2.20"},
		Order:       5, // 办公网探索
	},
	{
		ID:          12,
		Name:        "老旧 Telnet 服务",
		Description: "利用古老的 Telnet 服务获取办公网老旧主机访问权",
		Difficulty:  "Easy",
		Points:      150,
		Flag:        "FSCAN_LAB{t3ln3t_l3g4cy_syst3m}",
		Hints:       []string{"扫描办公网 23 端口", "尝试 admin/admin", "cat /root/flag12.txt"},
		Network:     "office",
		Targets:     []string{"10.10.2.24"},
		Order:       4, // 办公网探索
	},
	{
		ID:          13,
		Name:        "打印机 SMB 共享",
		Description: "发现办公网打印机的 SMB 共享服务，通过弱密码访问共享文件",
		Difficulty:  "Medium",
		Points:      200,
		Flag:        "FSCAN_LAB{smb_pr1nt3r_sh4r3_pwn3d}",
		Hints:       []string{"扫描办公网 445 端口 (SMB)", "用户名: printer, 尝试弱密码爆破", "共享名: print$ 或 backup"},
		Network:     "office",
		Targets:     []string{"10.10.2.23"},
		Order:       6, // 办公网探索
	},
}

// networkTopology contains the network structure for visualization
var networkTopology = NetworkTopology{
	Nodes: []NetworkNode{
		{ID: "internet", Name: "Internet", IP: "172.16.0.0/24", Services: []string{}, Network: "internet", Status: "discovered"},
		{ID: "attacker", Name: "Attacker", IP: "172.16.0.2", Services: []string{"fscan"}, Network: "internet", Status: "compromised"},
		{ID: "web-dmz", Name: "Web DMZ", IP: "10.10.1.10", Services: []string{"Tomcat:8080"}, Network: "dmz", Status: "unknown"},
		{ID: "mail-dmz", Name: "Mail DMZ", IP: "10.10.1.11", Services: []string{"SMTP:25"}, Network: "dmz", Status: "unknown"},
		{ID: "ftp-dmz", Name: "FTP DMZ", IP: "10.10.1.12", Services: []string{"FTP:21"}, Network: "dmz", Status: "unknown"},
		{ID: "vpn-gateway", Name: "VPN Gateway", IP: "10.10.1.13/10.10.2.2", Services: []string{"SSH:22"}, Network: "dmz", Status: "unknown"},
		{ID: "pc-vnc", Name: "PC VNC", IP: "10.10.2.20", Services: []string{"VNC:5901"}, Network: "office", Status: "unknown"},
		{ID: "pc-ssh", Name: "PC SSH", IP: "10.10.2.21", Services: []string{"SSH:22"}, Network: "office", Status: "unknown"},
		{ID: "backup-server", Name: "Backup Server", IP: "10.10.2.22", Services: []string{"Rsync:873"}, Network: "office", Status: "unknown"},
		{ID: "printer", Name: "Printer", IP: "10.10.2.23", Services: []string{"SMB:445"}, Network: "office", Status: "unknown"},
		{ID: "oldpc-telnet", Name: "Old PC", IP: "10.10.2.24", Services: []string{"Telnet:23"}, Network: "office", Status: "unknown"},
		{ID: "app-web", Name: "App Web", IP: "10.10.3.30", Services: []string{"Tomcat:8080"}, Network: "production", Status: "unknown"},
		{ID: "cache-redis", Name: "Cache Redis", IP: "10.10.3.31", Services: []string{"Redis:6379"}, Network: "production", Status: "unknown"},
		{ID: "mq-rabbit", Name: "RabbitMQ", IP: "10.10.3.32", Services: []string{"RabbitMQ:5672,15672"}, Network: "production", Status: "unknown"},
		{ID: "mq-activemq", Name: "ActiveMQ", IP: "10.10.3.33", Services: []string{"ActiveMQ:61613,61614"}, Network: "production", Status: "unknown"},
		{ID: "search-es", Name: "Elasticsearch", IP: "10.10.3.34", Services: []string{"ES:9200"}, Network: "production", Status: "unknown"},
		{ID: "db-mysql", Name: "MySQL DB", IP: "10.10.4.40", Services: []string{"MySQL:3306"}, Network: "core", Status: "unknown"},
		{ID: "db-mssql", Name: "MSSQL DB", IP: "10.10.4.41", Services: []string{"MSSQL:1433"}, Network: "core", Status: "unknown"},
		{ID: "db-postgres", Name: "PostgreSQL DB", IP: "10.10.4.42", Services: []string{"PostgreSQL:5432"}, Network: "core", Status: "unknown"},
		{ID: "db-mongo", Name: "MongoDB", IP: "10.10.4.43", Services: []string{"MongoDB:27017"}, Network: "core", Status: "unknown"},
		{ID: "dc-ldap", Name: "Domain Controller", IP: "10.10.4.44", Services: []string{"LDAP:389,636"}, Network: "core", Status: "unknown"},
	},
	Edges: []NetworkEdge{
		{From: "attacker", To: "web-dmz", Access: "allowed"},
		{From: "attacker", To: "mail-dmz", Access: "allowed"},
		{From: "attacker", To: "ftp-dmz", Access: "allowed"},
		{From: "attacker", To: "vpn-gateway", Access: "allowed"},
		{From: "vpn-gateway", To: "pc-vnc", Access: "vpn"},
		{From: "vpn-gateway", To: "pc-ssh", Access: "vpn"},
		{From: "vpn-gateway", To: "backup-server", Access: "vpn"},
		{From: "vpn-gateway", To: "printer", Access: "vpn"},
		{From: "vpn-gateway", To: "oldpc-telnet", Access: "vpn"},
		{From: "backup-server", To: "cache-redis", Access: "allowed"},
		{From: "cache-redis", To: "db-mysql", Access: "allowed"},
		{From: "cache-redis", To: "db-mssql", Access: "allowed"},
		{From: "cache-redis", To: "db-postgres", Access: "allowed"},
		{From: "cache-redis", To: "db-mongo", Access: "allowed"},
		{From: "cache-redis", To: "dc-ldap", Access: "allowed"},
	},
}

// challengeToNodes maps challenge IDs to compromised node IDs
var challengeToNodes = map[int][]string{
	1:  {"web-dmz"},                    // Flag 1: DMZ Web 服务器
	2:  {"ftp-dmz"},                    // Flag 2: FTP 弱密码
	3:  {"vpn-gateway"},                // Flag 3: VPN 网关
	4:  {"backup-server"},              // Flag 4: 备份服务器
	5:  {"cache-redis"},                // Flag 5: Redis
	6:  {"db-mysql"},                   // Flag 6: MySQL
	7:  {"db-mongo"},                   // Flag 7: MongoDB (最终目标)
	8:  {"search-es"},                  // Flag 8: Elasticsearch
	9:  {"db-postgres"},                // Flag 9: PostgreSQL
	10: {"db-mssql"},                   // Flag 10: MSSQL
	11: {"pc-vnc"},                     // Flag 11: VNC
	12: {"oldpc-telnet"},               // Flag 12: Telnet
	13: {"printer"},                    // Flag 13: SNMP
}

// challengeMap provides O(1) lookup by challenge ID
var challengeMap map[int]*Challenge

func init() {
	challengeMap = make(map[int]*Challenge, len(challenges))
	for i := range challenges {
		challengeMap[challenges[i].ID] = &challenges[i]
	}
}

// getChallengeByID returns a challenge by ID or error if not found
func getChallengeByID(id int) (*Challenge, error) {
	ch, ok := challengeMap[id]
	if !ok {
		return nil, fmt.Errorf("challenge not found")
	}
	return ch, nil
}

// contains checks if a slice contains a value
func contains(slice []int, val int) bool {
	for _, v := range slice {
		if v == val {
			return true
		}
	}
	return false
}

const progressFile = "/app/data/progress.json"

func loadProgress() (*Progress, error) {
	data, err := os.ReadFile(progressFile)
	if err != nil {
		if os.IsNotExist(err) {
			return &Progress{
				UserID:                "default",
				CompletedChallenges:   []int{},
				TotalScore:            0,
				StartTime:             time.Now(),
				LastUpdate:            time.Now(),
				SubmissionHistory:     []Submission{},
			}, nil
		}
		return nil, err
	}

	var progress Progress
	if err := json.Unmarshal(data, &progress); err != nil {
		return nil, err
	}
	return &progress, nil
}

func saveProgress(progress *Progress) error {
	progress.LastUpdate = time.Now()
	data, err := json.MarshalIndent(progress, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(progressFile, data, 0644)
}

func main() {
	os.MkdirAll("/app/data", 0755)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/api/challenges", getChallenges)
	r.GET("/api/challenges/:id", getChallenge)
	r.POST("/api/submit", submitFlag)
	r.GET("/api/progress", getProgress)
	r.POST("/api/reset", resetProgress)
	r.GET("/api/topology", getTopology)
	r.GET("/api/hints/:id", getHints)

	log.Println("Starting fscan-lab API server on :8888")
	r.Run(":8888")
}

func getChallenges(c *gin.Context) {
	publicChallenges := make([]map[string]interface{}, len(challenges))
	for i, ch := range challenges {
		publicChallenges[i] = map[string]interface{}{
			"id":          ch.ID,
			"name":        ch.Name,
			"description": ch.Description,
			"difficulty":  ch.Difficulty,
			"points":      ch.Points,
			"network":     ch.Network,
			"targets":     ch.Targets,
			"order":       ch.Order, // 渗透顺序
		}
	}
	c.JSON(http.StatusOK, publicChallenges)
}

func getChallenge(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	challenge, err := getChallengeByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          challenge.ID,
		"name":        challenge.Name,
		"description": challenge.Description,
		"difficulty":  challenge.Difficulty,
		"points":      challenge.Points,
		"network":     challenge.Network,
		"targets":     challenge.Targets,
	})
}

func submitFlag(c *gin.Context) {
	var req struct {
		ChallengeID int    `json:"challenge_id"`
		Flag        string `json:"flag"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	challenge, err := getChallengeByID(req.ChallengeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	progress, err := loadProgress()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load progress"})
		return
	}

	correct := strings.TrimSpace(req.Flag) == strings.TrimSpace(challenge.Flag)
	alreadySolved := contains(progress.CompletedChallenges, req.ChallengeID)

	// Record submission
	progress.SubmissionHistory = append(progress.SubmissionHistory, Submission{
		ChallengeID: req.ChallengeID,
		Flag:        req.Flag,
		Correct:     correct,
		Timestamp:   time.Now(),
	})

	// Award points for first-time completion
	if correct && !alreadySolved {
		progress.CompletedChallenges = append(progress.CompletedChallenges, req.ChallengeID)
		progress.TotalScore += challenge.Points
	}

	if err := saveProgress(progress); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"correct":        correct,
		"message":        map[bool]string{true: "Congratulations! Flag accepted!", false: "Incorrect flag. Try again!"}[correct],
		"points_earned":  challenge.Points,
		"total_score":    progress.TotalScore,
		"already_solved": alreadySolved,
	})
}

func getProgress(c *gin.Context) {
	progress, err := loadProgress()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load progress"})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func resetProgress(c *gin.Context) {
	progress := &Progress{
		UserID:                "default",
		CompletedChallenges:   []int{},
		TotalScore:            0,
		StartTime:             time.Now(),
		LastUpdate:            time.Now(),
		SubmissionHistory:     []Submission{},
	}

	if err := saveProgress(progress); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progress reset successfully"})
}

func getTopology(c *gin.Context) {
	progress, err := loadProgress()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load progress"})
		return
	}

	// Build set of compromised nodes based on completed challenges
	compromisedNodes := make(map[string]bool)
	for _, challengeID := range progress.CompletedChallenges {
		if nodeIDs, ok := challengeToNodes[challengeID]; ok {
			for _, nodeID := range nodeIDs {
				compromisedNodes[nodeID] = true
			}
		}
	}

	// Clone topology and update node statuses
	topology := NetworkTopology{
		Nodes: make([]NetworkNode, len(networkTopology.Nodes)),
		Edges: networkTopology.Edges,
	}

	for i, node := range networkTopology.Nodes {
		topology.Nodes[i] = node
		// Update status based on progress
		if compromisedNodes[node.ID] {
			topology.Nodes[i].Status = "compromised"
		}
	}

	c.JSON(http.StatusOK, topology)
}

func getHints(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	challenge, err := getChallengeByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"hints": challenge.Hints})
}
