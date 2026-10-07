import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppCard, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import type { Post } from "../models/muro.model";
import { formatPostDate, likesLabel, safeLinkLabel } from "../utils/muro-format";
import { PostImageGallery } from "./post-image-gallery";

interface PostCardProps {
  post: Post;
  liking: boolean;
  likeDisabled: boolean;
  disabled: boolean;
  error?: string;
  onLike: () => void;
  onOpenLink: (url: string) => void;
}

export function PostCard({ post, liking, likeDisabled, disabled, error, onLike, onOpenLink }: PostCardProps) {
  const title = post.title ?? "Sin título";
  const date = formatPostDate(post.createdAt);
  const count = likesLabel(post.likesCount);
  return (
    <AppCard style={styles.card}>
      <View style={styles.heading}>
        <AppText variant="sectionTitle" accessibilityRole="header">{title}</AppText>
        {date ? <AppText variant="auxiliary" color="textSecondary">{date}</AppText> : null}
      </View>
      {post.description ? (
        <View style={styles.description}><AppText color="textSecondary" selectable>{post.description}</AppText></View>
      ) : null}
      {post.content ? <AppText selectable>{post.content}</AppText> : null}
      {post.images.length ? (
        <PostImageGallery key={JSON.stringify(post.images.map((image) => image.url))} images={post.images} title={title} disabled={disabled} />
      ) : null}
      {post.links.length ? (
        <View style={styles.links}>
          {post.links.map((link, index) => (
            <Pressable
              key={link.url + ":" + index}
              accessibilityRole="link"
              accessibilityLabel={"Abrir enlace externo: " + (link.title ?? safeLinkLabel(link.url))}
              accessibilityHint="Se abre fuera de la aplicación."
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={() => onOpenLink(link.url)}
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}
            >
              <AppText style={styles.linkText}>{link.title ?? safeLinkLabel(link.url)}</AppText>
              <AppText variant="auxiliary" color="textSecondary">Abrir enlace ↗</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? <AppText color="textSecondary" accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={(post.userHasLiked ? "Quitar like de " : "Dar like a ") + title + ", " + count}
        accessibilityState={{ selected: post.userHasLiked, disabled: likeDisabled || liking, busy: liking }}
        disabled={likeDisabled || liking}
        onPress={onLike}
        style={({ pressed }) => [styles.like, post.userHasLiked && styles.liked, (likeDisabled || liking) && styles.disabled, pressed && styles.pressed]}
      >
        {liking ? <ActivityIndicator size="small" color={Colors.headerGreen} /> : <AppText style={styles.heart} accessible={false}>{post.userHasLiked ? "♥" : "♡"}</AppText>}
        <AppText variant="auxiliary">{liking ? "Actualizando like…" : count}</AppText>
        {post.userHasLiked && !liking ? <AppText variant="auxiliary" color="textSecondary">Te gusta</AppText> : null}
      </Pressable>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.md, gap: Spacing.md },
  heading: { gap: Spacing.xs },
  description: { paddingLeft: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.headerGreen },
  links: { gap: Spacing.sm },
  link: { minHeight: 48, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, gap: Spacing.xs },
  linkText: { color: Colors.darkGreen, textDecorationLine: "underline" },
  like: { minHeight: 52, padding: Spacing.sm, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  liked: { borderRadius: Radius.sm, backgroundColor: Colors.background },
  heart: { fontSize: 28, lineHeight: 32, color: Colors.headerGreen },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.6 },
});
