export interface ModalProps {
  selectedFlag?: string;
  onClose: () => void;
  receivedDate?: string;
  tagNum?: number;
  onTagChange?: (tagNum: number) => void;
}
