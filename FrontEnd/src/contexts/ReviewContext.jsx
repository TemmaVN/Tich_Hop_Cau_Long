/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import { reviewApi } from "../api";

const ReviewContext = createContext(null);

export const useReview = () => {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error("useReview must be used within a ReviewProvider");
  return ctx;
};

export const ReviewProvider = ({ children }) => {
  const [productReviews, setProductReviews] = useState([]);
  const [averageRating, setAverageRating]   = useState(0);
  const [myReviews, setMyReviews]           = useState([]);
  const [reviewableItems, setReviewableItems] = useState([]);
  const [adminReviews, setAdminReviews]     = useState([]);
  const [loading, setLoading]               = useState(false);
  const [pagination, setPagination]         = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });

  // ── Public: reviews of a product ─────────────────────────────────────
  const fetchProductReviews = async (productId, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await reviewApi.getByProduct(productId, page, pageSize);
      setProductReviews(res.data.items ?? []);
      setAverageRating(res.data.averageRating ?? 0);
      setPagination({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.totalPages ?? 0,
        currentPage: page,
      });
    } catch (err) {
      console.error("fetchProductReviews failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Customer: own reviews ─────────────────────────────────────────────
  const fetchMyReviews = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await reviewApi.getMyReviews(page, pageSize);
      setMyReviews(res.data.items ?? []);
      setPagination({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.totalPages ?? 0,
        currentPage: page,
      });
    } catch (err) {
      console.error("fetchMyReviews failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Customer: items eligible for review ───────────────────────────────
  const fetchReviewableItems = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await reviewApi.getMyReviewableItems(page, pageSize);
      setReviewableItems(res.data.items ?? []);
      setPagination({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.totalPages ?? 0,
        currentPage: page,
      });
    } catch (err) {
      console.error("fetchReviewableItems failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Customer: reviews for a specific order (filter by orderDetailIds) ─
  const fetchOrderReviews = async (orderDetailIds = []) => {
    try {
      const res = await reviewApi.getMyReviews(1, 100);
      const ids = new Set(orderDetailIds);
      return (res.data.items ?? []).filter(r => ids.has(r.orderDetailId));
    } catch (err) {
      console.error("fetchOrderReviews failed:", err);
      return [];
    }
  };

  // ── Customer: create a review ─────────────────────────────────────────
  const createReview = async (data) => {
    try {
      const res = await reviewApi.create(data);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  // ── Customer: update own review ───────────────────────────────────────
  const updateReview = async (reviewId, data) => {
    try {
      const res = await reviewApi.update(reviewId, data);
      setMyReviews((prev) =>
        prev.map((r) => (r.reviewId === reviewId ? res.data.data : r))
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  // ── Customer: delete own review ───────────────────────────────────────
  const deleteReview = async (reviewId) => {
    try {
      await reviewApi.delete(reviewId);
      setMyReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  // ── Admin: all reviews (with optional visibility filter) ──────────────
  const fetchAdminReviews = async (page = 1, pageSize = 10, isVisible = undefined) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (isVisible !== undefined) params.isVisible = isVisible;
      const res = await reviewApi.getForAdmin(params);
      setAdminReviews(res.data.items ?? []);
      setPagination({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.totalPages ?? 0,
        currentPage: page,
      });
    } catch (err) {
      console.error("fetchAdminReviews failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Admin: toggle review visibility ──────────────────────────────────
  const setReviewVisibility = async (reviewId, isVisible) => {
    try {
      await reviewApi.setVisibility(reviewId, isVisible);
      setAdminReviews((prev) =>
        prev.map((r) => (r.reviewId === reviewId ? { ...r, isVisible } : r))
      );
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message ?? err.message };
    }
  };

  return (
    <ReviewContext.Provider
      value={{
        productReviews,
        averageRating,
        myReviews,
        reviewableItems,
        adminReviews,
        loading,
        pagination,
        fetchProductReviews,
        fetchMyReviews,
        fetchReviewableItems,
        fetchOrderReviews,
        createReview,
        updateReview,
        deleteReview,
        fetchAdminReviews,
        setReviewVisibility,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};

export default ReviewProvider;
