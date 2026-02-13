"""
Python bridge script for ScaleDown compression.
Called from Node.js via child_process.execFile.

DATA FLOW:
  stdin (JSON) → ScaleDown Compressor → stdout (JSON)

Input format:  {"context": "...", "prompt": "..."}
Output format: {"content": "...", "originalTokens": N, "compressedTokens": M, "compressionRatio": R}
"""

import sys
import os
import json

# Add parent directories to path so we can import scaledown
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

import scaledown as sd

def main():
    try:
        # Read JSON input from stdin
        raw_input = sys.stdin.read()
        data = json.loads(raw_input)

        context = data.get('context', '')
        prompt = data.get('prompt', 'Summarize the key points')

        # Skip compression for very short texts
        if len(context) < 100:
            result = {
                "content": context,
                "originalTokens": len(context) // 4,
                "compressedTokens": len(context) // 4,
                "compressionRatio": 1.0,
            }
            print(json.dumps(result))
            return

        # Set API key from environment
        api_key = os.environ.get('SCALEDOWN_API_KEY', '')
        if api_key:
            sd.set_api_key(api_key)

        # Create compressor and compress
        compressor = sd.ScaleDownCompressor(
            target_model='gpt-4o',
            rate='auto'
        )

        compressed = compressor.compress(context=context, prompt=prompt)

        result = {
            "content": compressed.content,
            "originalTokens": compressed.tokens[0],
            "compressedTokens": compressed.tokens[1],
            "compressionRatio": round(compressed.compression_ratio, 2) if compressed.compression_ratio else 1.0,
        }

        print(json.dumps(result))

    except Exception as e:
        # On error, return original text as fallback
        error_result = {
            "content": data.get('context', '') if 'data' in dir() else '',
            "originalTokens": 0,
            "compressedTokens": 0,
            "compressionRatio": 1.0,
            "error": str(e),
        }
        print(json.dumps(error_result))
        sys.exit(0)  # Exit 0 so Node doesn't treat it as a crash

if __name__ == '__main__':
    main()
