# TC Wrapper API Documentation

A fast, OpenAI-compatible chat/completions API with built-in tool-calling capabilities.

---

## 🚀 Quick Start

### Endpoint

```
https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev
```

### API Keys

Use one of these in the `X-Api-Key` header:

```
ct-TestKey1  
ct-TestKey2  
ct-TestKey3
```

---

## Basic Example

```bash
curl -X POST https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ct-TestKey1" \
  -d '{
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

---

## 🐍 Python Examples

### Simple Chat

```python
import requests

def chat_with_tc(message, api_key="ct-TestKey1"):
    r = requests.post(
        "https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev/v1/chat/completions",
        headers={
            "Content-Type": "application/json",
            "X-Api-Key": api_key
        },
        json={"messages": [{"role": "user", "content": message}]}
    )
    return r.json()

# Example usage
result = chat_with_tc("What is the capital of France?")
print(result["choices"][0]["message"]["content"])
```

---

### OpenAI-SDK Compatible

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev/v1",
    api_key="ct-TestKey1"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",  # ignored by the service
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain machine learning in simple terms"}
    ]
)

print(response.choices[0].message.content)
```

---

## Tool Calling Example

```python
import requests, json

messages = [
    {
        "role": "system",
        "content": """You have access to these tools:
        1. calculator: Performs mathematical calculations
           Parameters: expression (string)
        2. get_weather: Gets current weather for a location
           Parameters: location (string)"""
    },
    {"role": "user", "content": "What's 1234 * 5678 and what's the weather in Tokyo?"}
]

resp = requests.post(
    "https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev/v1/chat/completions",
    headers={"Content-Type": "application/json", "X-Api-Key": "ct-TestKey1"},
    json={"messages": messages}
)

data = resp.json()
tool_calls = data["choices"][0]["message"].get("tool_calls", [])
for call in tool_calls:
    name = call["function"]["name"]
    args = call["function"]["arguments"]
    print(f"- {name}: {args}")
```

---

## 📋 Response Format

Returns an OpenAI-compatible payload:

```jsonc
{
  "id": "r1-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "<internal-model>",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "…",          // empty if a tool call was made
      "tool_calls": [          
        {
          "id": "call_r1_…",
          "type": "function",
          "function": {
            "name": "function_name",
            "arguments": "{\"param\":\"value\"}"
          }
        }
      ]
    },
    "finish_reason": "tool_calls"
  }],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

---

## 🛠️ Complete Python Client

```python
# save as tc_client.py
import requests, json
from typing import List, Dict, Any

class TCWrapperClient:
    def __init__(self, api_key: str = "ct-TestKey1"):
        self.base = "https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev"
        self.s = requests.Session()
        self.s.headers.update({
            "Content-Type": "application/json",
            "X-Api-Key": api_key
        })

    def chat(self, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        resp = self.s.post(f"{self.base}/v1/chat/completions",
                           json={"messages": messages, **kwargs})
        resp.raise_for_status()
        return resp.json()

    def ask(self, question: str) -> str:
        out = self.chat([{"role":"user","content":question}])
        m = out["choices"][0]["message"]
        return m.get("content") or json.dumps(m.get("tool_calls"))

    def health(self) -> Dict[str, str]:
        r = self.s.get(f"{self.base}/health")
        r.raise_for_status()
        return r.json()

if __name__ == "__main__":
    client = TCWrapperClient()
    print("Health:", client.health())
    print("2+2 =", client.ask("What is 2+2?"))
```

---

## 🔍 Testing Endpoints

### Health Check

```bash
curl https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev/health
# → {"status":"ok"}
```

### Simple Chat

```bash
curl -X POST https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ct-TestKey1" \
  -d '{"messages":[{"role":"user","content":"Say hello!"}]}'
```

---

## ⚡ Performance & Usage

* **Response time**: \~1–3 s
* **Rate limits**: 1000 req/min per key
* **Concurrency**: supports multiple concurrent calls
* **Tool calls**: when returned, execute them client-side and POST results back

---

## 🔒 Security

* Keep your `X-Api-Key` secret
* All requests are logged for debugging
* Use exponential backoff on `429`/`5xx`

Happy building! 🚀
