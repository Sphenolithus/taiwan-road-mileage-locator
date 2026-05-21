import argparse
import csv
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


DIRECTION_MAP = {
    "南": "south",
    "南下": "south",
    "北": "north",
    "北上": "north",
    "東": "east",
    "東向": "east",
    "東行": "east",
    "西": "west",
    "西向": "west",
    "西行": "west",
}

EXPRESSWAY_ROUTES = {
    "台61線",
    "台61乙線",
    "台62線",
    "台62甲線",
    "台63線",
    "台63甲線",
    "台64線",
    "台65線",
    "台66線",
    "台68線",
    "台68甲線",
    "台72線",
    "台74線",
    "台74甲線",
    "台76線",
    "台78線",
    "台82線",
    "台84線",
    "台86線",
    "台88線",
}

DEFAULT_DIRECTIONS = {
    "台20線": ["east", "west"],
    "台62線": ["east", "west"],
    "台62甲線": ["east", "west"],
    "台63甲線": ["east", "west"],
    "台64線": ["east", "west"],
    "台66線": ["east", "west"],
    "台68線": ["east", "west"],
    "台68甲線": ["east", "west"],
    "台72線": ["east", "west"],
    "台78線": ["east", "west"],
    "台82線": ["east", "west"],
    "台84線": ["east", "west"],
    "台86線": ["east", "west"],
    "台88線": ["east", "west"],
}


def parse_km(value):
    text = str(value or "").strip()
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)\s*[Kk](?:\s*\+\s*(\d+))?", text)
    if match:
        km = float(match.group(1))
        meters = float(match.group(2) or 0)
        return km + meters / 1000
    table_km = re.search(r"<TD>\s*(\d+(?:\.\d+)?)\s*</TD>\s*<TD>\s*(\d{1,3})K\+?(\d{1,3})", text, re.I)
    if table_km:
        return float(table_km.group(1)) / 1000
    try:
        return float(text)
    except ValueError:
        return None


def normalize_direction(value, route=""):
    text = str(value or "").strip()
    if text in {"雙向", "雙", "M", "", "順向", "逆向"}:
        return default_directions(route)
    mapped = DIRECTION_MAP.get(text, text.lower() or "")
    return [mapped] if mapped else default_directions(route)


def default_directions(route):
    return DEFAULT_DIRECTIONS.get(route, ["north", "south"])


def normalize_route(route):
    text = str(route or "").strip().replace(" ", "")
    freeway = re.fullmatch(r"國道?(\d+)(甲)?號?", text)
    if freeway:
        suffix = freeway.group(2) or ""
        return f"國道{freeway.group(1)}{suffix}號"
    provincial = re.fullmatch(r"台(\d+)(甲|乙|丙|丁|戊|己)?線?", text)
    if provincial:
        suffix = provincial.group(2) or ""
        return f"台{provincial.group(1)}{suffix}線"
    return text


def infer_category(route):
    route = route or ""
    if route.startswith("國道"):
        return "freeway"
    if route in EXPRESSWAY_ROUTES:
        return "expressway"
    return "provincial"


def in_scope(route):
    return route.startswith("國道") or route.startswith("台")


def first_value(row, names):
    for name in names:
        if name in row and str(row[name]).strip():
            return row[name]
    return ""


def csv_features(path):
    features = []
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            route = first_value(row, ["Road number", "道路編號", "路線", "路線編號", "route"])
            route = normalize_route(route or first_value(row, ["公路編號"]))
            lon = first_value(row, ["Coordinate-X-WGS84", "X_WGS84", "經度", "lon", "longitude"])
            lon = lon or first_value(row, ["坐標-E-WGS84"])
            lat = first_value(row, ["Coordinates-Y-WGS84", "Y_WGS84", "緯度", "lat", "latitude"])
            lat = lat or first_value(row, ["坐標-N-WGS84"])
            km = parse_km(first_value(row, ["Face Content", "牌面內容", "里程", "km", "mileage"]))
            km = km if km is not None else parse_km(first_value(row, ["百公尺里程樁位置"]))
            if not route or not in_scope(route) or km is None or not lon or not lat:
                continue
            directions = normalize_direction(first_value(row, ["Direction", "方向", "dir", "牌面方向"]), route)
            for direction in directions:
                features.append(make_feature(route, direction, km, float(lon), float(lat), row))
    return features


def kml_features(path):
    text = Path(path).read_text(encoding="utf-8", errors="ignore")
    root = ET.fromstring(text)
    ns = {"kml": "http://www.opengis.net/kml/2.2"}
    placemarks = root.findall(".//kml:Placemark", ns) or root.findall(".//Placemark")
    features = []
    for placemark in placemarks:
        name_el = placemark.find("kml:name", ns)
        if name_el is None:
            name_el = placemark.find("name")
        coord_el = placemark.find(".//kml:Point/kml:coordinates", ns)
        if coord_el is None:
            coord_el = placemark.find(".//Point/coordinates")
        if coord_el is None or not coord_el.text:
            continue
        name = name_el.text if name_el is not None else ""
        desc_el = placemark.find("kml:description", ns)
        if desc_el is None:
            desc_el = placemark.find("description")
        desc = html.unescape(desc_el.text or "") if desc_el is not None else ""
        route = normalize_route(extract_table_value(desc, "RoadName") or Path(path).stem)
        km = parse_km(name)
        km = km if km is not None else parse_km(desc)
        directions = normalize_direction(extract_table_value(desc, "LR"), route)
        lon, lat, *_ = [float(part) for part in coord_el.text.strip().split(",")]
        if route and in_scope(route) and km is not None:
            for direction in directions:
                features.append(make_feature(route, direction, km, lon, lat, {"name": name}))
    return features


def freeway_csv_features(path):
    features = []
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            desc = html.unescape(first_value(row, ["百公尺里程樁位置"]))
            route = normalize_route(extract_table_value(desc, "RoadName"))
            km = parse_km(extract_table_value(desc, "KM2") or desc)
            lon = first_value(row, ["經度", "lon", "longitude"]) or extract_table_value(desc, "X")
            lat = first_value(row, ["緯度", "lat", "latitude"]) or extract_table_value(desc, "Y")
            if route and in_scope(route) and km is not None and lon and lat:
                for direction in normalize_direction(extract_table_value(desc, "LR"), route):
                    features.append(make_feature(route, direction, km, float(lon), float(lat), row))
    return features


def extract_table_value(text, field_name):
    if not text:
        return ""
    headers = re.findall(r"<TH[^>]*>\s*([^<]+?)\s*</TH>", text, re.I)
    values = re.findall(r"<TD[^>]*>\s*([^<]*?)\s*</TD>", text, re.I)
    try:
        index = headers.index(field_name)
    except ValueError:
        return ""
    return values[index].strip() if index < len(values) else ""


def make_feature(route, direction, km, lon, lat, source):
    return {
        "type": "Feature",
        "properties": {
            "category": infer_category(route),
            "route": route,
            "direction": direction,
            "km": km,
            "label": source.get("name") or source.get("Face Content") or source.get("牌面內容") or "",
        },
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
    }


def main():
    parser = argparse.ArgumentParser(description="Convert official mileage CSV/KML files to mileposts.geojson.")
    parser.add_argument("--csv", action="append", default=[], help="THB mileage CSV path")
    parser.add_argument("--freeway-csv", action="append", default=[], help="Freeway mileage CSV path")
    parser.add_argument("--kml", action="append", default=[], help="Freeway or road mileage KML path")
    default_out = Path(__file__).resolve().parent.parent / "data" / "mileposts.geojson"
    parser.add_argument("--out", default=str(default_out), help="Output GeoJSON path")
    args = parser.parse_args()

    features = []
    for path in args.csv:
        features.extend(csv_features(path))
    for path in args.freeway_csv:
        features.extend(freeway_csv_features(path))
    for path in args.kml:
        path_obj = Path(path)
        if path_obj.is_dir():
            for kml_path in path_obj.rglob("*.kml"):
                features.extend(kml_features(kml_path))
        else:
            features.extend(kml_features(path_obj))

    features.sort(key=lambda item: (item["properties"]["category"], item["properties"]["route"], item["properties"]["direction"], item["properties"]["km"]))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(features)} features to {out_path}")


if __name__ == "__main__":
    main()
