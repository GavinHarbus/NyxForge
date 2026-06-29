package system_setting

var ServerAddress = "http://localhost:3000"

// ApiBaseUrl is the public base URL shown to users for API calls (for example an
// API-only domain such as https://api.example.com). It is independent of
// ServerAddress, which is used for OAuth callbacks, webhooks and the Passkey RP
// ID. The frontend falls back to ServerAddress when ApiBaseUrl is empty.
var ApiBaseUrl = ""
var WorkerUrl = ""
var WorkerValidKey = ""
var WorkerAllowHttpImageRequestEnabled = false

func EnableWorker() bool {
	return WorkerUrl != ""
}
