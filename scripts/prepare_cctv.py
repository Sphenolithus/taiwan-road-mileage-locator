import argparse
import base64
import gzip
import json
import urllib.request
from pathlib import Path


TDX_CCTV_URLS = [
    "https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/CCTV/Freeway?$format=JSON",
    "https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/CCTV/Highway?$format=JSON",
]


def fetch_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "taiwan-road-mileage-locator/1.0"})
    with urllib.request.urlopen(request, timeout=40) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize_direction(value):
    text = str(value or "").strip().upper()
    if text in {"S", "SB", "SOUTH"}:
        return "south"
    if text in {"N", "NB", "NORTH"}:
        return "north"
    if text in {"E", "EB", "EAST"}:
        return "east"
    if text in {"W", "WB", "WEST"}:
        return "west"
    return text.lower() if text else ""


def normalize_camera(raw, authority):
    lon = raw.get("PositionLon")
    lat = raw.get("PositionLat")
    if lon is None or lat is None:
        return None
    try:
        lon = float(lon)
        lat = float(lat)
    except (TypeError, ValueError):
        return None

    stream_url = raw.get("VideoStreamURL") or ""
    image_url = raw.get("VideoImageURL") or ""
    if not stream_url and not image_url:
        return None

    return {
        "type": "Feature",
        "properties": {
            "id": raw.get("CCTVID") or "",
            "source": authority,
            "subAuthority": raw.get("SubAuthorityCode") or "",
            "route": raw.get("RoadName") or "",
            "roadId": raw.get("RoadID") or "",
            "direction": normalize_direction(raw.get("RoadDirection")),
            "mile": raw.get("LocationMile") or "",
            "description": raw.get("SurveillanceDescription") or "",
            "streamUrl": stream_url,
            "imageUrl": image_url,
            "linkId": raw.get("LinkID") or "",
        },
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
    }


def build_collection(payloads):
    features = []
    metadata = []
    seen = set()

    for payload in payloads:
        authority = payload.get("AuthorityCode") or ""
        metadata.append(
            {
                "authority": authority,
                "updateTime": payload.get("UpdateTime") or "",
                "sourceUpdateTime": payload.get("SrcUpdateTime") or "",
                "linkVersion": payload.get("LinkVersion") or "",
            }
        )
        for raw in payload.get("CCTVs") or []:
            feature = normalize_camera(raw, authority)
            if not feature:
                continue
            props = feature["properties"]
            lon, lat = feature["geometry"]["coordinates"]
            key = (props["id"], props["streamUrl"], lon, lat)
            if key in seen:
                continue
            seen.add(key)
            features.append(feature)

    features.sort(
        key=lambda item: (
            item["properties"]["source"],
            item["properties"]["route"],
            item["properties"]["direction"],
            item["properties"]["mile"],
            item["properties"]["id"],
        )
    )

    return {
        "type": "FeatureCollection",
        "metadata": {"sources": metadata, "count": len(features)},
        "features": features,
    }


def write_outputs(collection, out_path):
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(collection, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if out_path.suffix == ".b64":
        out_path.write_text(base64.b64encode(gzip.compress(raw)).decode("ascii"), encoding="ascii")
    else:
        out_path.write_bytes(raw)


def main():
    parser = argparse.ArgumentParser(description="Fetch and prepare TDX CCTV data.")
    parser.add_argument("--url", action="append", default=[], help="TDX CCTV API URL")
    parser.add_argument("--json", action="append", default=[], help="Local JSON payload path")
    default_out = Path(__file__).resolve().parent.parent / "data" / "cctv.geojson.gz.b64"
    parser.add_argument("--out", default=str(default_out), help="Output path")
    args = parser.parse_args()

    payloads = []
    source_urls = args.url or ([] if args.json else TDX_CCTV_URLS)
    for url in source_urls:
        payloads.append(fetch_json(url))
    for path in args.json:
        payloads.append(json.loads(Path(path).read_text(encoding="utf-8")))

    collection = build_collection(payloads)
    write_outputs(collection, args.out)
    print(f"Wrote {len(collection['features'])} CCTV features to {args.out}")


if __name__ == "__main__":
    main()
