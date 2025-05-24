import os, json, bot3, logging
import requests
from datetime import datetime
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ["TABLE_NAME"]
API_KEY   = os.environ["EMON_API_KEY"]
URL_BASE  = os.environ["EMON_URL_BASE"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

def flatten_zero(v):
    v = float(v)
    return 0 if -5 <= v <= 5 else v

def lambda_handler(event, context):
    params = event.get("queryStringParameters") or {}
    if not params:
        logger.warning("Missing query params")
        return {"statusCode":400, "body":"No data"}

    # Parse & normalize
    a = flatten_zero(params.get("a_act_power", 0))
    b = flatten_zero(params.get("b_act_power", 0))
    c = max(flatten_zero(params.get("c_act_power", 0)), 0)

    consumata = max(-a, 0)
    batteria_immessa   = max(-b, 0)
    batteria_prelevata = max(b,  0)
    prelevata = max(consumata - c - batteria_prelevata, 0)
    immessa   = max(- (consumata - c - batteria_prelevata), 0)

    payload = {
        "Prodotta": c,
        "Consumata": consumata,
        "Prelevata": prelevata,
        "Immessa": immessa,
        "Batteria_Immessa": batteria_immessa,
        "Batteria_Prelevata": batteria_prelevata,
        "Volt": float(params.get("c_voltage", 0))
    }

    try:
        timestamp = datetime.now().timestamp()
        dynamo_item = {
            "message_id": str(timestamp),
            **{k: str(v) for k, v in payload.items()}  
        }
        table.put_item(Item=dynamo_item)
        logger.info("Successfully stored data in DynamoDB")
        
    except ClientError as e:
        logger.error(f"Failed to store data in DynamoDB: {e}")
        return {"statusCode": 502, "body": "DynamoDB error"}
        

    try:
        response = requests.get(
            f"{EMON_URL_BASE}{EMON_API_KEY}",
            params={"json": json.dumps(payload)},
            timeout=5
        )
        response.raise_for_status()
        
    except requests.RequestException as e:
        logger.error("Failed to push to Emoncms", exc_info=e)
        return {"statusCode": 502, "body": "Emoncms error"}

    logger.info("Success", extra=payload)
    
    return {
        "statusCode":200,
        "body": json.dumps({"message":"ok","sent":payload}),
        "headers":{"Content-Type":"application/json"}
    }
