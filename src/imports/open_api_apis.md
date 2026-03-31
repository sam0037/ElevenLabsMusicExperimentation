# Python code to fetch the open ai models using the API key

```
import http.client

conn = http.client.HTTPSConnection("api.openai.com")

payload = ""

headers = {
    'cookie': "_cfuvid=5ZT3ThO38S9R.sYGCWRQqAwhJPDTgnHjOswMvhkZJPU-1772610026.3037102-1.0.1.1-oPfidLiQrgkWay7KM1AgdJdPfrmBVcROr8GWFL_XkNQ",
    'Authorization': "Bearer sk-open-ai-api-key"
    }

conn.request("GET", "/v1/models", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
```