import * as aws from "@pulumi/aws";
import { Request, Response } from "@pulumi/awsx/apigateway";
import { createShop, ShopError, ShopParams } from "../shops";
import { notFound, response, withCORS } from "../utils";
import { getHistoricalData, metadata } from "../product-detail";
import { DataRow, parseData, getRealDiscount } from "../discount";

function createDataset(data: DataRow[]) {
  const originalPrice = new Array(data.length);
  const currentPrice = new Array(data.length);

  data.forEach((item, i) => {
    originalPrice[i] = {
      x: item.date,
      y: item?.originalPrice
    };
    currentPrice[i] = {
      x: item.date,
      y: item?.currentPrice
    };
  });

  return { originalPrice, currentPrice };
}

export async function handler(event: Request): Promise<Response> {
  try {
    const params = (<unknown>(event.queryStringParameters || {})) as ShopParams;
    if (!params.url) {
      return withCORS(["GET", "OPTIONS"])({
        statusCode: 400,
        body: JSON.stringify({ error: "Missing url parameter" })
      });
    }

    const db = new aws.sdk.DynamoDB.DocumentClient();
    const shop = createShop(params);
    if (!shop) {
      return withCORS(["GET", "OPTIONS"])(notFound());
    }

    let itemId = params.itemId ?? shop.itemId;
    const metad = await metadata(db, shop.name, <string>shop.itemUrl, itemId);

    itemId = itemId ?? metad?.itemId;
    let item = await getHistoricalData(db, shop.name, itemId ?? "");
    if (!item) {
      return withCORS(["GET", "OPTIONS"])(notFound());
    }

    const rows = parseData(item);
    const discount = getRealDiscount(rows);
    const meta = ({
      itemImage,
      itemName,
      real_sale,
      max_price,
      ...rest
    }: any) => ({
      name: itemName,
      imageUrl: itemImage === "null" ? null : itemImage,
      ...discount,
      ...rest
    });
    return withCORS(["GET", "OPTIONS"])(
      response(
        { data: createDataset(rows), metadata: meta(metad) },
        { "Cache-Control": "max-age=3600" }
      )
    );
  } catch (error) {
    if (error instanceof ShopError) {
      const { message } = error;
      return withCORS(["GET", "OPTIONS"])(
        notFound({ data: [], metadata: { "error": message } })
      );
    } else {
      throw error;
    }
  }
}
