import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EvidenceCard from '../../components/EvidenceCard';
import { AppFile } from '../../types/index';

describe('EvidenceCard Component', () => {
  const mockOnDelete = jest.fn();
  const mockOnView = jest.fn();
  const mockOnDownload = jest.fn();

  const mockFile: AppFile = {
    id: 1,
    investigation_id: 1,
    filename: 'test-image.jpg',
    file_path: '/uploads/test-image.jpg',
    file_type: 'image',
    mime_type: 'image/jpeg',
    file_size: 1024 * 100,
    uploaded_at: '2024-01-15T10:30:00Z',
    title: 'Test Image',
    description: 'This is a test image for evidence',
    tags: ['evidence', 'test'],
    trust_level: 'high',
    uploaded_by: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
  });

  const renderEvidenceCard = (file: AppFile = mockFile) => {
    return render(
      <EvidenceCard
        file={file}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onDownload={mockOnDownload}
      />
    );
  };

  describe('Rendering', () => {
    it('renders file title correctly', () => {
      renderEvidenceCard();
      expect(screen.getByTestId('file-title')).toHaveTextContent('Test Image');
    });

    it('renders file size correctly', () => {
      renderEvidenceCard();
      expect(screen.getByTestId('file-size')).toHaveTextContent('100 KB');
    });

    it('renders file size in MB for larger files', () => {
      const largeFile = { ...mockFile, file_size: 1024 * 1024 * 5 };
      renderEvidenceCard(largeFile);
      expect(screen.getByTestId('file-size')).toHaveTextContent('5 MB');
    });

    it('renders description when provided', () => {
      renderEvidenceCard();
      expect(screen.getByTestId('file-description')).toBeInTheDocument();
    });

    it('renders upload date in Russian format', () => {
      renderEvidenceCard();
      expect(screen.getByTestId('file-date')).toHaveTextContent('15.01.2024');
    });
  });

  describe('Trust Level Display', () => {
    it('shows high trust level', () => {
      renderEvidenceCard();
      expect(screen.getByTestId('trust-level')).toHaveTextContent('Высокий');
    });

    it('shows low trust level', () => {
      const lowTrustFile = { ...mockFile, trust_level: 'low' as const };
      renderEvidenceCard(lowTrustFile);
      expect(screen.getByTestId('trust-level')).toHaveTextContent('Низкий');
    });
  });

  describe('User Interactions', () => {
    it('calls onView when view button is clicked', () => {
      renderEvidenceCard();
      const viewButton = screen.getByTestId('view-button');
      fireEvent.click(viewButton);
      expect(mockOnView).toHaveBeenCalledTimes(1);
    });

    it('calls onDownload when download button is clicked', () => {
      renderEvidenceCard();
      const downloadButton = screen.getByTestId('download-button');
      fireEvent.click(downloadButton);
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked and confirmed', () => {
      renderEvidenceCard();
      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });
});