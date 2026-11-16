"""Scripted stand-in for an OpenAI-compatible LLM provider (no real model, no key)."""
import json

def sse(chunks):
    return "".join(f"data: {json.dumps(c, ensure_ascii=False)}\n\n" for c in chunks) + "data: [DONE]\n\n"

def tool_call(name, args):
    return sse([
        {"model": "scripted-demo", "choices": [{"index": 0, "delta": {"tool_calls": [
            {"index": 0, "id": "call_" + name, "type": "function",
             "function": {"name": name, "arguments": json.dumps(args, ensure_ascii=False)}}]}}]},
        {"choices": [{"index": 0, "delta": {}, "finish_reason": "tool_calls"}]}])

def text(t):
    # stream in a few chunks so the chat shows typing
    parts = [t[i:i+40] for i in range(0, len(t), 40)]
    chunks = [{"model": "scripted-demo", "choices": [{"index": 0, "delta": {"content": p}}]} for p in parts]
    chunks.append({"choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]})
    return sse(chunks)

HEADERS = {"content-type": "text/event-stream", "access-control-allow-origin": "*"}
