import sys
import json
from fertilizer_recommendations import get_fertilizer_recommendation

def main():
    try:
        input_data = sys.stdin.read()
        print(f"Received input: {input_data}", file=sys.stderr)

        try:
            data = json.loads(input_data)
            # Validate input data
            required_fields = ["nitrogen", "phosphorous", "potassium", "cropname"]
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field: {field}")
            
            nitrogen = float(data["nitrogen"])
            phosphorous = float(data["phosphorous"])
            potassium = float(data["potassium"])
            cropname = data["cropname"]

            recommendation = get_fertilizer_recommendation(nitrogen, phosphorous, potassium, cropname)
            print(json.dumps({"recommendation": recommendation}))
        except json.JSONDecodeError as e:
            print(f"Error: Unable to parse input as JSON. Raw input: {input_data}", file=sys.stderr)
            print(json.dumps({"error": "Unable to parse input as JSON"}))
        except ValueError as ve:
            print(f"Validation Error: {ve}", file=sys.stderr)
            print(json.dumps({"error": str(ve)}))
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            print(json.dumps({"error": str(e)}))
    except Exception as e:
        print(f"Fatal Error: {str(e)}", file=sys.stderr)
        print(json.dumps({"error": "Fatal error occurred"}))

if __name__ == "__main__":
    main()
