import { useState } from "react";
import Avatar from "../components/common/Avatar";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Skeleton from "../components/common/Skeleton";
import ThemeToggle from "../components/common/ThemeToggle";
import { Check, Plus, Search } from "../components/common/icons";
import useTheme from "../hooks/useTheme";

const SURFACES = [
  { name: "canvas", cls: "bg-canvas" },
  { name: "subtle", cls: "bg-subtle" },
  { name: "border", cls: "bg-border" },
  { name: "border-strong", cls: "bg-border-strong" },
  { name: "accent", cls: "bg-accent" },
  { name: "accent-emphasis", cls: "bg-accent-emphasis" },
  { name: "success", cls: "bg-success" },
  { name: "attention", cls: "bg-attention" },
  { name: "danger", cls: "bg-danger" },
  { name: "done", cls: "bg-done" },
];

const TEXTS = [
  { name: "fg", cls: "text-fg" },
  { name: "muted", cls: "text-muted" },
  { name: "accent", cls: "text-accent" },
  { name: "success", cls: "text-success" },
  { name: "attention", cls: "text-attention" },
  { name: "danger", cls: "text-danger" },
  { name: "done", cls: "text-done" },
];

const ACCENTS = ["default", "violet", "teal", "orange", "pink", "green"];

const SAMPLE_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#8250df"/><circle cx="4" cy="4" r="2" fill="#fff"/></svg>',
  );

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {children}
    </section>
  );
}

function Showcase() {
  return (
    <div className="space-y-6">
      <Section title="Warna (isi)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SURFACES.map(({ name, cls }) => (
            <div key={name} className="min-w-0">
              <div className={`h-10 rounded-md border border-border ${cls}`} />
              <p className="mt-1 break-words text-xs text-muted">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Warna (teks di atas canvas)">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
          {TEXTS.map(({ name, cls }) => (
            <span key={name} className={cls}>
              {name}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <Plus size={16} aria-hidden="true" /> Small
          </Button>
          <Button variant="secondary" size="sm">
            Small
          </Button>
          <Button loading>Menyimpan</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Input">
        <div className="grid gap-3">
          <Input label="Nama" placeholder="Contoh: naruto_fan" />
          <Input label="Email" hint="Kami tidak membagikan email kamu." />
          <Input label="Password" type="password" error="Minimal 8 karakter." />
          <Input
            label="Dinonaktifkan"
            disabled
            defaultValue="Tidak bisa diubah"
          />
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">Watching</Badge>
          <Badge tone="success">
            <Check size={12} aria-hidden="true" /> Completed
          </Badge>
          <Badge tone="attention">Plan to watch</Badge>
          <Badge tone="danger">Dropped</Badge>
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="Aoi Tanaka" size="sm" />
          <Avatar name="Aoi Tanaka" />
          <Avatar name="Budi" size="lg" />
          <Avatar src={SAMPLE_AVATAR} name="Gambar contoh" size="lg" />
          <Avatar />
        </div>
      </Section>

      <Section title="Card dan Skeleton">
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </Card>
      </Section>

      <Section title="Aksen profil">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACCENTS.map((key) => (
            <div
              key={key}
              data-accent={key === "default" ? undefined : key}
              className="space-y-2 rounded-md border border-border p-3"
            >
              <div className="h-1.5 rounded-full bg-profile-accent" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted">{key}</span>
                <span className="inline-flex min-h-8 items-center gap-1 rounded-md bg-profile-accent px-3 text-xs font-medium text-profile-on-accent">
                  <Search size={14} aria-hidden="true" /> Ikuti
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export default function DesignPreview() {
  const { mode, resolvedTheme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div data-theme={resolvedTheme} className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto max-w-screen-xl space-y-8 px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Pratinjau desain (dev)</h1>
            <p className="text-sm text-muted">
              Mode: {mode}, tema aktif: {resolvedTheme}
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Modal">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Buka modal
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Contoh modal"
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button onClick={() => setModalOpen(false)}>Simpan</Button>
              </>
            }
          >
            <p className="mb-3 text-muted">
              Fokus terkunci di dalam modal. Tekan Esc atau klik latar untuk
              menutup.
            </p>
            <Input label="Judul" placeholder="Ketik sesuatu" />
          </Modal>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div
            data-theme="light"
            className="min-w-0 rounded-md border border-border bg-canvas p-4 text-fg"
          >
            <h2 className="mb-4 text-base font-semibold">Terang</h2>
            <Showcase />
          </div>
          <div
            data-theme="dark"
            className="min-w-0 rounded-md border border-border bg-canvas p-4 text-fg"
          >
            <h2 className="mb-4 text-base font-semibold">Gelap</h2>
            <Showcase />
          </div>
        </div>
      </div>
    </div>
  );
}
