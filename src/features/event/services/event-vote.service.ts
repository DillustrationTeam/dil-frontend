import { apiClient, extractErrorMessage } from '@/lib/api-client';

export const eventVoteService = {
  /**
   * Thực hiện bình chọn (vote) cho bài dự thi
   */
  voteSubmission: async (submissionId: string): Promise<void> => {
    try {
      await apiClient.post(`/event-submissions/${submissionId}/vote`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to submit vote. Please try again.'));
    }
  },

  /**
   * Hủy bình chọn (unvote) bài dự thi
   */
  unvoteSubmission: async (submissionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/event-submissions/${submissionId}/vote`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to revoke vote. Please try again.'));
    }
  },
};
