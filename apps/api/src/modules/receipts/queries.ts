import mongoose from "mongoose";
import { Receipt } from "../../../../../packages/database/src/models/receipt/Receipt.js";

interface DashboardAggregation {
  stats: Array<{ total: number; pending: number; processing: number; completed: number }>;
  graphData: Array<{ _id: string; uploads: number }>;
  recentReceipts: Array<Record<string, unknown>>;
}

export async function getDashboardQuery(userId: string) {

  const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const result = await Receipt.aggregate<DashboardAggregation>([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },

    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,

              total: { $sum: 1 },

              pending: {
                $sum: {
                  $cond: [{ $eq: ["$status", "needs_approval"] }, 1, 0],
                },
              },

              processing: {
                $sum: {
                  $cond: [{ $eq: ["$status", "processing"] }, 1, 0],
                },
              },

              completed: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$status", "approved"] },
                        { $eq: ["$status", "rejected"] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
        graphData: [
          {
            $match: {
              createdAt: {
                $gte: thirtyDaysAgo,
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
              uploads: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ],
        recentReceipts: [
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $limit: 4,
          },
          {
            $project: {
              name: 1,
              status: 1,
              createdAt: 1,
              totalAmount: "$extractedData.totalAmount",
            },
          },
        ],
      },
    },
  ]);

  const data = result[0];

  if (!data) {
    return {
      stats: { total: 0, pending: 0, processing: 0, completed: 0 },
      graphData: [],
      recentReceipts: [],
    };
  }

  return {
    stats: data.stats[0] || {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
    },

    graphData: data.graphData || [],

    recentReceipts: data.recentReceipts || [],
  };
}

