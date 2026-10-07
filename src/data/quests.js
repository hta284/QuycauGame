// Quest System Data
export const QUESTS = [
  {
    id: "Q01",
    name: "Tìm người thân",
    description: "Bạn trở về ngôi làng quê vào một buổi sáng yên bình. Lan Chi đã rời nhà trước khi bạn tới; hãy kiểm tra ngôi nhà cũ để tìm manh mối.",
    objective: "Vào ngôi nhà cũ của gia đình và tìm Bức ảnh gia đình (CLUE 02).",
    targetLocation: "Nhà nhân vật chính",
    completed: false
  },
  {
    id: "Q02",
    name: "Nói chuyện với bà Lan",
    description: "Bà Lan là hàng xóm lâu năm. Hãy hỏi bà lần cuối cùng bà gặp Lan Chi.",
    objective: "Đến nhà Bà Lan và nói chuyện để tìm hiểu tung tích người thân.",
    targetLocation: "Nhà Bà Lan",
    completed: false
  },
  {
    id: "Q03",
    name: "Hỏi thăm dân làng",
    description: "Lan Chi được nhìn thấy ở nhiều nơi trong làng. Hãy ghé quầy tạp hóa và hỏi ông Tư ở đình để lần theo dấu vết.",
    objective: "Nói chuyện với cô Hảo ở chợ và ông Tư gần đình làng.",
    targetLocation: "Chợ làng và đình",
    completed: false
  },
  {
    id: "Q04",
    name: "Tìm manh mối tại nghĩa địa",
    description: "Theo lời dân làng, Lan Chi đã đi về phía khu mộ cũ phía sau đình.",
    objective: "Đi tới Nghĩa Địa và tìm kiếm Trang Nhật Ký Cũ (CLUE 05) trên bia mộ hoang.",
    targetLocation: "Nghĩa địa",
    completed: false
  },
  {
    id: "Q05",
    name: "Gặp Người Giữ Miếu ở cửa rừng",
    description: "Dấu chân của Lan Chi dẫn tới cửa rừng. Người giữ miếu có thể giúp bạn tìm đường vào.",
    objective: "Nói chuyện với Người Giữ Miếu để nhận Bùa Trấn Yểm (CLUE 08) và mở lối vào rừng.",
    targetLocation: "Con đường dẫn vào rừng",
    completed: false
  },
  {
    id: "Q06",
    name: "Lần theo dấu vết trong rừng",
    description: "Sau một buổi chiều điều tra, hãy trở về nhà nghỉ ngơi. Đêm xuống, lần theo mảnh vải để tìm dấu vết của Lan Chi.",
    objective: "Trở về nhà nghỉ khi trời tối, rồi tìm Mảnh Vải (CLUE 07) ở cửa rừng.",
    targetLocation: "Miếu Cũ",
    completed: false
  },
  {
    id: "Q07",
    name: "Phát hiện người thân",
    description: "Bạn đã đến được Miếu Cũ! Người thân đang bị trói giam giữ giữa bàn tế lễ, nhưng một nguồn tà khí khủng khiếp đang ập đến.",
    objective: "Tiếp cận bàn thờ tế lễ để cứu người thân.",
    targetLocation: "Bàn thờ Miếu Cũ",
    completed: false
  },
  {
    id: "Q08",
    name: "Đối đầu & Tiêu diệt Quỷ Cẩu",
    description: "Quỷ Cẩu đã hiện nguyên hình! Hãy né tránh đòn vồ, kích hoạt 3 Bệ Thờ Trấn Yểm và dùng Ngọn Lửa Thiêng để tiêu diệt nó!",
    objective: "Kích hoạt 3 Bệ Thờ xung quanh miếu để phá kết giới tà khí, sau đó thiêu hủy Quỷ Cẩu!",
    targetLocation: "Khu vực Boss Miếu Cũ",
    completed: false
  },
  {
    id: "Q09",
    name: "Cứu người thân & Rời khỏi làng",
    description: "Quỷ Cẩu đã bị đánh bại tan biến thành tro bụi. Hãy cởi trói cho người thân và dẫn cô ấy an toàn rời khỏi làng trước bình minh.",
    objective: "Cởi trói giải cứu người thân và đưa cô ấy trở về Cổng Làng.",
    targetLocation: "Cổng làng",
    completed: false
  }
];
