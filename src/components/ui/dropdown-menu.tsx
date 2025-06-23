import * as React from "react";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";

export function DropdownMenu({
  trigger,
  children,
}: {
  trigger: (
    props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      ref: React.Ref<HTMLButtonElement>;
    },
  ) => React.ReactElement;
  children: React.ReactNode;
}) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button ref={buttonRef} as={Fragment}>
          {trigger({ ref: buttonRef })}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          as="div"
          className="absolute left-0 mt-2 w-40 rounded-md bg-white shadow-lg focus:outline-none z-[99999]"
          style={{ minWidth: buttonRef.current?.offsetWidth || undefined }}
        >
          {children}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export function DropdownMenuItem({
  onClick,
  children,
  disabled,
}: {
  onClick?: () => void | Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Menu.Item disabled={disabled}>
      {({ active, disabled }) => (
        <button
          className={`w-full text-left px-4 py-2 text-sm focus:outline-none cursor-pointer ${
            active ? "bg-gray-100" : ""
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onClick={onClick}
          type="button"
          disabled={disabled}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}
